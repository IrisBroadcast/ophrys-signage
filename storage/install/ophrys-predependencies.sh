#!/bin/bash

USERINPUTFILE="/usr/local/aloe/conf/userinput"
. $USERINPUTFILE

HOST_BASEFOLDER="/usr/local/aloe"
STORAGEFOLDER="/usr/local/aloe/nodewebb/OphrysSignage/storage"
COMPONENTFOLDER="/usr/local/aloe/nodewebb/OphrysSignage/storage/components"
INSTALL_LOG="/var/log/ophrys-full-install.log"
NPM_HTTP_PROXY=$USER_HTTP_PROXY
NPM_HTTPS_PROXY=$USER_HTTPS_PROXY
NPM_REGISTRY="http://registry.npmjs.org/"

function startTimingTheInstall
{
    # Start timing the install
    MSG="Installation - preparing components"
    INSTALLPROGRESS=20

    TIME=$(date +"%H:%M")
    echo "START="$TIME > /tmp/timing
}

function setUpLogDirectory
{
    # Setting up log directory
    MSG="Setting up log directory"
    INSTALLPROGRESS=25

    echo "FULL INSTALL INITIATED $(date)" > $INSTALL_LOG
    echo "#####################" >> $INSTALL_LOG
    echo "" >> $INSTALL_LOG
    echo "*** INIT PROCESS START ***" >> $INSTALL_LOG
    echo "--------------------" >> $INSTALL_LOG
}

function createFolders
{
    # Create needed folders
    mkdir -p $HOST_BASEFOLDER/scripts
    mkdir -p $HOST_BASEFOLDER/conf
    mkdir -p $HOST_BASEFOLDER/graphics
}

function copyPrimaryFilesToHostFolders
{
    # Copying primary files to host - needed for component install
    MSG="Copying primary files to host"
    INSTALLPROGRESS=30

    cp $STORAGEFOLDER/scripts/common.sh $HOST_BASEFOLDER/scripts/common.sh
    cp $STORAGEFOLDER/scripts/dpkg-helpscript.sh $HOST_BASEFOLDER/scripts/dpkg-helpscript.sh
    cp $STORAGEFOLDER/conf/configuration $HOST_BASEFOLDER/conf/configuration
    cp $STORAGEFOLDER/conf/device.txt $HOST_BASEFOLDER/conf/device.txt
}

function installJq
{
    # JQ is needed to parse json files
    MSG="Installing JQ (needed for parsing json files)"
    INSTALLPROGRESS=32
    apt-get -y install jq &>> $INSTALL_LOG
}

function installLightDm
{
    # Will install window manager LightDM
    MSG="Installing LightDM (window manager)"
    INSTALLPROGRESS=34
    apt-get -y install lightdm &>> $INSTALL_LOG
}

function installNodeJsAndNpm
{
    # Installing NodeJS-NPM
    MSG="Installing NodeJS-NPM"
    INSTALLPROGRESS=35

    ### CHANGE THIS WHEN UPDATING VERSION
    NODEVERSION="v12.14.1"
    ###

    DIR_TEMP="/tmp"
    DIR_VERSION="node-$NODEVERSION-linux-armv7l"
    CURRENTVERSION=$(node --version)

    if [ $NODEVERSION == $CURRENTVERSION ];then
		echo "Correct version installed, no need to update node"
        return 0
	fi

    if [ -z "$USER_HTTP_PROXY" ];then
        wget -O $DIR_TEMP/nodenpm.tar.xz https://nodejs.org/dist/$NODEVERSION/node-$NODEVERSION-linux-armv7l.tar.xz &>> $INSTALL_LOG
    else
        wget -O $DIR_TEMP/nodenpm.tar.xz https://nodejs.org/dist/$NODEVERSION/node-$NODEVERSION-linux-armv7l.tar.xz -e use_proxy=yes -e https_proxy=$USER_HTTPS_PROXY &>> $INSTALL_LOG
    fi
    cd $DIR_TEMP
	tar -xvf nodenpm.tar.xz &>> $INSTALL_LOG
	cd $DIR_VERSION
	sudo cp -fR * /usr/ &>> $INSTALL_LOG
}

function npmSettings
{
    # NPM settings - proxy & registry
    MSG="Configuring NPM"
    INSTALLPROGRESS=40

    if [ ! -z "$NPM_HTTP_PROXY" ];then
        npm config set proxy $NPM_HTTP_PROXY &>> $INSTALL_LOG
        npm config set no_proxy .localhost &>> $INSTALL_LOG
    fi
    if [ ! -z "$NPM_HTTPS_PROXY" ];then
        npm config set https-proxy $NPM_HTTPS_PROXY &>> $INSTALL_LOG
        npm config set no_proxy .localhost &>> $INSTALL_LOG
    fi
    npm config set registry $NPM_REGISTRY &>> $INSTALL_LOG
}

function enableOpenBox
{
    # Enabling OpenBox
    MSG="Enabling OpenBox"
    INSTALLPROGRESS=42

	FILE=/etc/lightdm/lightdm.conf

    grep -q "user-session=default" $FILE
    if [ $? -eq 0 ];then
        sed -i '/user-session=default/c\user-session=openbox' $FILE
    fi
}

function finalizePreInstall
{
    # Finalizing preinstall (removing obsolete files and directories)
    MSG="Finalizing preinstall"
    INSTALLPROGRESS=44

    DIR_PI="/home/pi"
    if [ -d $DIR_PI ];then
        rm -r $DIR_PI/Desktop &>> $INSTALL_LOG
        rm -r $DIR_PI/Documents &>> $INSTALL_LOG
        rm -r $DIR_PI/Downloads &>> $INSTALL_LOG
        rm -r $DIR_PI/MagPi &>> $INSTALL_LOG
        rm -r $DIR_PI/Music &>> $INSTALL_LOG
        rm -r $DIR_PI/Pictures &>> $INSTALL_LOG
        rm -r $DIR_PI/Templates &>> $INSTALL_LOG
        rm -r $DIR_PI/Videos &>> $INSTALL_LOG
        rm -r $DIR_PI/Public &>> $INSTALL_LOG
    fi
}

function runWhiptailPreDependencies()
{
    sleep 3
    for var in "$@"
    do
        $var
        echo XXX
        echo $INSTALLPROGRESS
        echo ${MSG[i1]}
        echo XXX
    done | whiptail --title "Ophrys Signage" --gauge "Installation - dependencies" 6 70 20
}
runWhiptailPreDependencies startTimingTheInstall setUpLogDirectory createFolders copyPrimaryFilesToHostFolders installJq installLightDm installNodeJsAndNpm npmSettings enableOpenBox finalizePreInstall

# Below will run all components located in directory storage/components
{
    sleep 3
    number=45
    for entry in $COMPONENTFOLDER/*
    do
        echo -e "XXX\n\nRunning Component:${entry##*/}\nXXX"
        echo $number
        bash $entry > /dev/null 2>&1
        number=$((number+5))
    done
    echo -e "XXX\n100\nInstallation finished ... device will reboot\nXXX"
    sleep 5
} | whiptail --title "Ophrys Signage" --gauge "Preparing component install ... " 6 70 45
reboot