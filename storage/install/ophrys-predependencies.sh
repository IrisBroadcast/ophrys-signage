#!/bin/bash

COMPONENTFOLDER="/usr/local/aloe/nodewebb/OphrysSignage/storage/components"

# This whiptail function will run all components located in directory storage/components
{
    sleep 2
    number=20
    for entry in $COMPONENTFOLDER/*
    do
        echo -e "XXX\n\nRunning Component:${entry##*/}\nXXX"
        echo $number
        bash $entry > /dev/null 2>&1
        number=$((number+5))
    done
    echo -e "XXX\n100\nInstallation finished ... device will reboot\nXXX"
    sleep 4
} | whiptail --title "Ophrys Signage" --gauge "Preparing component install ... " 6 70 20

reboot