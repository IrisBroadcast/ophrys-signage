#!/bin/bash

COMMONFILE=/usr/local/aloe/scripts/common.sh
. $COMMONFILE

# This script updates the Linux system - attended to be used during night time on hosts that are online 24/7
# The script will check the output/the log file after the update to decide whether a reboot is required
# Every run will be logged and found in /var/log/aloe/update-os-crontab.log
# ATTENTION: The possible reboot will be initiated regardless of the status of other applications

LOGFILE="/var/log/aloe/$(date '+%Y-%m-%d')_update-os-crontab.log"
LOGFOLDER="/var/log/aloe"

function checkFile
{
    if [ -d $LOGFOLDER ];then
        echo "::: Latest update STATUS :::" > $LOGFILE
        echo "Update initiated: "$(date) >> $LOGFILE
        echo "" >> $LOGFILE
    else
        mkdir -p $LOGFOLDER
        echo "::: Latest update STATUS :::" > $LOGFILE
        echo "Update initiated: "$(date) >> $LOGFILE
        echo "" >> $LOGFILE
    fi
}

function upgradeOS
{
    PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin sudo apt-get update -y >> $LOGFILE
    if [ $? -eq 0 ]; then
        echo "APT-GET UPDATE = SUCCES" >> $LOGFILE
        echo "" >> $LOGFILE
    else
        echo "APT-GET UPDATE = FAILED!!" >> $LOGFILE
        echo "" >> $LOGFILE
    fi

    PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin sudo apt-get upgrade -y >> $LOGFILE
    if [ $? -eq 0 ]; then
        echo "APT-GET UPGRADE = SUCCESS" >> $LOGFILE
        echo "" >> $LOGFILE
    else
        echo "APT-GET UPGRADE = FAILED!!" >> $LOGFILE
        echo "" >> $LOGFILE
    fi
}

function checkIfRebootIsNeeded
{
    if grep -q "reboot the system" $LOGFILE; then
        echo "FINALIZE STATUS: REBOOT REQUIRED AND INITIATED" >> $LOGFILE
        echo $(date) >> $LOGFILE
        PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin sudo reboot
    else
        echo "FINALIZE STATUS: NO REBOOT REQUIRED" >> $LOGFILE
        echo $(date) >> $LOGFILE
        exit 0
    fi
}

removePossibleOldFiles
checkFile
upgradeOS
if [ $? -ne 0 ]; then
    FUNC_SUCCESS=false
    FUNC_MESSAGE="Crontab - upgrade OS - Failed"
    functionInfo
    exit 64
fi
checkIfRebootIsNeeded