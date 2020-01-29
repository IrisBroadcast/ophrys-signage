#!/bin/bash

DEVICE="/usr/local/aloe/conf/device.txt"
DPKG_HELP="/usr/local/aloe/scripts/dpkg-helpscript.sh"
CONFIGURATION="/usr/local/aloe/conf/configuration"
UNIQUE_USER_INPUTFILE="/usr/local/aloe/conf/userinput"
PROGRESSFILE="/tmp/progress"
NEWINSTALL="/tmp/newinstall"
INSTALL_LOG="/var/log/ophrys-full-install.log"
. $DEVICE
. $DPKG_HELP
. $CONFIGURATION
. $UNIQUE_USER_INPUTFILE

TYPE="ophrys-signage"
TMP_UPDATEFILE="/tmp/apt-get-update-recent-run"
DATE=$(date -I'seconds')
TMPFILE=/tmp/tempfile

#### EXIT CODE SECTION ####
REBOOT=100
RESTARTSERVICE_ALL=101
FORCE_REBOOT=255
##########################

function publish()
{
    # Arg 1 - Topic # Arg 2 - Message
    # Broker with TLS
    /usr/bin/mosquitto_pub --cafile $CERT -i $KLIENT$HOSTNAME -h $MQTT_BROKER -p $MQTT_PORT -q 1 -t $1 -m "$2" -u $SERIAL

    # Broker without TLS
    #   /usr/bin/mosquitto_pub -i $KLIENT -h $MQTT_BROKER -p $MQTT_PORT -q 1 -t $1 -m "$2" -u $SERIAL

    RET=$?
    if test $RET -ne 0
    then
        echo "MQTT failed. Code $RET - $1"
        exit 42
    fi
        echo Debug Publicera $1 :: "$2"
    return
}

function curling()
{
    ## CURL SOURCE ARGS > DEST ###
    curl ${1} > ${2}
}

function restartservice()
{
    case $1 in
        101 )
            service="aloe*"
            rm /tmp/*       #Emtpying temp-folder as it may hold some temp-references
    ;;

    * )
        service="null"
    ;;

    esac
    if [ "$service" != "null" ];then
        systemctl restart $service
    fi
}

function checkIfNewInstall
{
    if [ ! -f /tmp/newinstall ];then
        echo "This is not a new install - continuing..."
    else
        COMP_MESSAGE="This is a new install - no need to run "$COMP_NAME
        componentInfo
        sleep 1
        exit 0
    fi
}

if [ $# == 101 ];then
	echo "Argument $1 supplied (message from common file)"
	restartservice $1
fi

# --MQTT Topics--
# General - Component - used by every component
COMP_NAME=""
COMP_SUCCESS=true
COMP_MESSAGE=""
COMP_CLASS="info"
function componentInfo
{
    if [ "$MQTT_ENABLE" == true ];then
        TOPIC=""
        MESSAGE=""
        publish "$TOPIC" "$MESSAGE"
    else
        return 0
    fi
}

# General - Function - used by many functions within the component files
FUNC_NAME=""
FUNC_SUCCESS=false
FUNC_MESSAGE=""
FUNC_REPAIR_PACKAGES=false
FUNC_REPAIR_FILES=false
BROKENFILE=""
function functionInfo
{
    if ($FUNC_SUCCESS == true);then
        FUNC_CLASS="info"
    else
        FUNC_CLASS="error"
    fi

    if [ "$MQTT_ENABLE" == true ];then
        TOPIC=""
        MESSAGE=""
        publish "$TOPIC" "$MESSAGE"
    else
        return 0
    fi
}

function verifyDownloadedFile()
{
    FILETOCHECK=$1
    grep -q "Error: ENOENT: no such file or directory" $FILETOCHECK
    if [ $? -eq 0 ];then
        echo "Error - no such file or directory (message from common file)"
        return 1
    else
        echo "File verified successfully (message from common file)"
        return 0
    fi
}

function updateApt
{
    echo "Not in use at the moment"
}

function reportResult()
{
    if ($COMP_SUCCESS);then
        echo "" >> $INSTALL_LOG
        echo $DATE >> $INSTALL_LOG
        echo "Component: $COMP_NAME" | tee -a $INSTALL_LOG
        echo "Result: SUCCESS" >> $INSTALL_LOG
        echo "--------------------" >> $INSTALL_LOG
    else
        echo "" >> $INSTALL_LOG
        echo $DATE >> $INSTALL_LOG
        echo "Component: $COMP_NAME" | tee -a $INSTALL_LOG
        echo "Result: FAILED" >> $INSTALL_LOG
        echo "--------------------" >> $INSTALL_LOG
    fi
}

function reportError
{
    ERRORFILE="/var/log/ophrys_errors.log"
    echo "" >> $ERRORFILE
    echo "$DATE Component: $FUNC_NAME - Error occured" | tee -a $ERRORFILE
    echo "Error message: $FUNC_MESSAGE" | tee -a $ERRORFILE
    echo "-------------" >> $ERRORFILE
	cat $TMPFILE >> $ERRORFILE
    rm $TMPFILE
}