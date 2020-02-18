#!/bin/bash

COMMONFILE=/usr/local/aloe/scripts/common.sh
. $COMMONFILE

EVDEVFILE="/usr/share/X11/xorg.conf.d/45-evdev.conf"
HARDWARE=""
TMP=$(mktemp)
HOST=$(hostname)
STATE_URL=""
STATE_ROTATION=""
ARG1=$1

function initCheck
{
    # Find RPI revisons - https://elinux.org/RPi_HardwareHistory
    if (cat /proc/cpuinfo | grep 'Revision' | awk '{print $3}' | sed 's/^1000//') | grep '03111';then
        HARDWARE="RPI4"
    else
        HARDWARE="RPI3"
    fi

    echo "Arguments: $ARG1"
    if [ "$ARG1" == "rotate" ];then
        readFromStatusFileNode

    elif [ "$ARG1" == "url" ] || [ "$ARG1" == "refresh" ];then
        readFromStatusFileNode
    else
        writeToStatusFileBash
    fi
}

function readFromStatusFileNode
{
    STATEFILENODE="$SCRIPTFOLDER/ophrys_state_node.json"

    ## Check if ophrys_state_node.json exists
    if [ -e $STATEFILENODE ];then

        if [ "$ARG1" == "rotate" ];then
            STATE_ROTATE=$(cat $STATEFILENODE | jq -r '.rotation')
            echo "STATE_ROTATE: $STATE_ROTATE"
            doRotate

        elif [ "$ARG1" == "url" ] || [ "$ARG1" == "refresh" ];then
            STATE_URL=$(cat $STATEFILENODE | jq -r '.url')
            STATE_BROWSERPARAMETER=$(cat $STATEFILENODE | jq -r '.browserparameter')
            echo "STATE_URL: $STATE_URL"
            echo "STATE_BROWSERPARAMETER: $STATE_BROWSERPARAMETER"
            setCorrespondingBackgroundImage
        fi
    fi
}

function doRotate
{
    checkBootFileRotate
    rotateScreen
    if [ $? -eq 0 ];then
        setCorrespondingBackgroundImage
        writeToStatusFileBash
        exit 0
    fi
}

function checkBootFileRotate
{
    BOOTFILE="/boot/config.txt"
    TEXT1="lcd_rotate="
    TEXT2="display_rotate="

    # Remove all possible old settings in boot file: /boot/config.txt
    grep -q $TEXT1 $BOOTFILE
    if [ $? -eq 0 ];then
        sed -i '/lcd_rotate=/d' $BOOTFILE
    fi

    grep -q $TEXT2 $BOOTFILE
    if [ $? -eq 0 ];then
        sed -i '/display_rotate=/d' $BOOTFILE
    fi
}

function rotateScreen
{
    DEVICE_ROTATE="Option \"rotate"\"
    VALUE_DEVICE=""

    SECTION_SWAP="Option \"SwapAxes"\"
    VALUE_SWAP=""

    SECTION_X="Option \"InvertX"\"
    VALUE_X=""

    SECTION_Y="Option \"InvertY"\"
    VALUE_Y=""

    if [ "$STATE_ROTATE" == "normal" ];then
    VALUE_DEVICE=" \""\"
    VALUE_SWAP=" \"0"\"
    VALUE_X=" \"0"\"
    VALUE_Y=" \"0"\"

    elif [ "$STATE_ROTATE" == "left" ];then
    VALUE_DEVICE=" \"CCW"\"
    VALUE_SWAP=" \"1"\"
    VALUE_X=" \"1"\"
    VALUE_Y=" \"0"\"

    elif [ "$STATE_ROTATE" == "inverted" ];then
    VALUE_DEVICE=" \"UD"\"
    VALUE_SWAP=" \"0"\"
    VALUE_X=" \"1"\"
    VALUE_Y=" \"1"\"

    elif [ "$STATE_ROTATE" == "right" ];then
    VALUE_DEVICE=" \"CW"\"
    VALUE_SWAP=" \"1"\"
    VALUE_X=" \"0"\"
    VALUE_Y=" \"1"\"
    fi

    sed -i "/${DEVICE_ROTATE}/c $DEVICE_ROTATE$VALUE_DEVICE" $EVDEVFILE
    sed -i "/${SECTION_SWAP}/c $SECTION_SWAP$VALUE_SWAP" $EVDEVFILE
    sed -i "/${SECTION_X}/c $SECTION_X$VALUE_X" $EVDEVFILE
    sed -i "/${SECTION_Y}/c $SECTION_Y$VALUE_Y" $EVDEVFILE
}

function setCorrespondingBackgroundImage
{
    if [ "$ARG1" == "rotate" ];then

        if [ "$STATE_ROTATE" == "normal" ];then
            cp $GRAPHICSFOLDER/rotate_normal_inverted.png $GRAPHICSFOLDER/splash.png
            restartServices
            sleep 5
            # Re-set default splash
            cp $GRAPHICSFOLDER/splash_normal_inverted.png $GRAPHICSFOLDER/splash.png

        elif [ "$STATE_ROTATE" == "inverted" ];then
            cp $GRAPHICSFOLDER/rotate_normal_inverted.png $GRAPHICSFOLDER/splash.png
            restartServices
            sleep 5
            # Re-set default splash
            cp $GRAPHICSFOLDER/splash_normal_inverted.png $GRAPHICSFOLDER/splash.png

        elif [ "$STATE_ROTATE" == "left" ];then
            cp $GRAPHICSFOLDER/rotate_left_right.png $GRAPHICSFOLDER/splash.png
            restartServices
            sleep 5
            # Re-set default splash
            cp $GRAPHICSFOLDER/splash_left_right.png $GRAPHICSFOLDER/splash.png

        elif [ "$STATE_ROTATE" == "right" ];then
            cp $GRAPHICSFOLDER/rotate_left_right.png $GRAPHICSFOLDER/splash.png
            restartServices
            sleep 5
            # Re-set default splash
            cp $GRAPHICSFOLDER/splash_left_right.png $GRAPHICSFOLDER/splash.png
        fi

    elif [ "$ARG1" == "url" ] || [ "$ARG1" == "refresh" ];then
        cp $GRAPHICSFOLDER/splash.png /tmp/tmp.png
        cp $GRAPHICSFOLDER/url_progress_normal_inverted.png $GRAPHICSFOLDER/splash.png
        sleep 1
        restartServices
        if [ $? -eq 0 ];then
            writeToStatusFileBash
        fi
        sleep 5
        # Re-set default splash
        cp /tmp/tmp.png $GRAPHICSFOLDER/splash.png
    fi
}

function restartServices
{
    touch /tmp/online
    service lightdm restart
    systemctl restart ophrys_displaywebpage
}

function writeToStatusFileBash
{
    STATEFILEBASH="$SCRIPTFOLDER/ophrys_state_bash.json"
    ## Make sure ophrys_state_bash.json exists, if not create the file
    if [ ! -e $STATEFILEBASH ];then
        cat <<EOT >> $STATEFILEBASH
{
  "hardwaremodel": "",
  "hostname": "",
  "url": "",
  "rotation": "",
  "browserparameter": ""
}
EOT
    fi

    export HW="$HARDWARE"
    export HOST="$HOST"
    cat $STATEFILEBASH | jq '{"hardwaremodel":env.HW, "hostname":env.HOST, "url":.url, "rotation":.rotation, "browserparameter":.browserparameter}' > "$TMP" && mv "$TMP" $STATEFILEBASH

    if [ "$ARG1" == "rotate" ];then
        export ROTATION="$STATE_ROTATE"
        cat $STATEFILEBASH | jq '{"hardwaremodel":.hardwaremodel, "hostname":.hostname, "url":.url, "rotation":env.ROTATION, "browserparameter":.browserparameter}' > "$TMP" && mv "$TMP" $STATEFILEBASH

    elif [ "$ARG1" == "url" ];then
        export URL="$STATE_URL"
        cat $STATEFILEBASH | jq '{"hardwaremodel":.hardwaremodel, "hostname":.hostname, "url":env.URL, "rotation":.rotation, "browserparameter":.browserparameter}' > "$TMP" && mv "$TMP" $STATEFILEBASH

    elif [ "$ARG1" == "refresh" ];then
        export BROWSERPARAMETER="$STATE_BROWSERPARAMETER"
        cat $STATEFILEBASH | jq '{"hardwaremodel":.hardwaremodel, "hostname":.hostname, "url":.url, "rotation":.rotation, "browserparameter":env.BROWSERPARAMETER}' > "$TMP" && mv "$TMP" $STATEFILEBASH
    fi

    chmod 775 $STATEFILEBASH
}

initCheck