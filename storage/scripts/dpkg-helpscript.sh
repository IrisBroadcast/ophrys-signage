#!/bin/bash

DEVICE=/usr/local/aloe/conf/device.txt
. $DEVICE

## This script will assist when using apt and function exit with errorcode

function safeApt ()
{
    FUNC_STATUS="Uncomplete function. "$1" triggered DPKG helpscript"
    functionInfo

    ## Might be due to packet problem...
    dpkg --configure -a
    apt --fix-broken install -y
    if apt-get update
    then
        echo "Running apt-get update is OK - no package problem...continuing"
    else
        echo "not ok result, will rm update folder and continuing"
        rm -r /var/lib/dpkg/updates/*
        if apt-get update
        then
            echo "Running apt-get update is OK - That was one of the problems"
            FUNC_STATUS="apt-get update was possible after repair"
            FUNC_REPAIR_PACKAGES=true
            functionInfo
        else
            echo "apt-get update not possible eventhough repair - needs manual intervention"
            FUNC_STATUS="apt-get update not possible eventhough repair - needs manual intervention"
            functionInfo
        fi
    fi

    ## Or a corrupt file problem
    ## Below might fix "dpkg return error (2)"
    for listfile in /var/lib/dpkg/info/*.list; do
        listfilename=$(basename -- "$listfile")
        listfilename="${listfilename%.*}"
        echo ${listfilename}
        #break
        output=$(file ${listfile}| awk '{print $2}')
        #echo "${output}"
        if [[ $output == *"data"* ]];then
            echo "${listfile} is CORRUPT!"
            echo "mv $listfile "${listfile}.broken" || exit $?"
            mv $listfile "${listfile}.broken"
            FUNC_STATUS="Found Broken file"
            FUNC_REPAIR_FILES=true
            BROKENFILE=$listfile
            functionInfo
            ##Creating a new empy file
            touch $listfile "${listfile}"  || exit $?
        fi
    done
}