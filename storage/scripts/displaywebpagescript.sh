#!/bin/bash

COMMONFILE=/usr/local/aloe/scripts/common.sh
. $COMMONFILE

STATEFILENODE="/usr/local/aloe/scripts/ophrys_state_node.json"

function cleanChromium
{
	PREFERENCES="/home/pi/.config/chromium/Default/Preferences"
    if [ -f $PREFERENCES ];then
	    sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/g' $PREFERENCES
    fi
}

function openUrl
{
	DYNAMIC_URL=$(cat $STATEFILENODE | jq -r '.url')
	BROWSERPARAMETER=$(cat $STATEFILENODE | jq -r '.browserparameter')

	# check if this is boot or not - Show IP-adress if this is boot
	TMPSPLASH="/tmp/splash.png"
	if [ ! -f /tmp/online ];then
		sudo cp $GRAPHICSFOLDER/splash.png $TMPSPLASH
    	IPv4=$(hostname -I)
        HOST=$(hostname)
        printf "convert -pointsize 40 -fill white -draw 'text 715,1000 \"IPv4: $IPv4\nHostname: $HOST\" ' /usr/local/aloe/graphics/embedip.png /usr/local/aloe/graphics/splash.png" > /tmp/temp
		sudo bash /tmp/temp
        sudo service lightdm restart
		sleep 10
		## Restore splashscreen to default
		if [ -f $TMPSPLASH ];then
			sudo cp $TMPSPLASH $GRAPHICSFOLDER/splash.png
		fi
	fi

	# Make sure state file exists
	if [ -e $STATEFILENODE ];then
    	DYNAMIC_URL=$(cat $STATEFILENODE | jq -r '.url')
		BROWSERPARAMETER=$(cat $STATEFILENODE | jq -r '.browserparameter')
	else
		DYNAMIC_URL="http://localhost:82"
		BROWSERPARAMETER=""
    fi
	if [ -z "$DYNAMIC_URL" ];then
		DYNAMIC_URL="http://localhost:82"
	fi
	export DISPLAY=:0.0
	chromium-browser $BROWSERPARAMETER --noerrdialogs --check-for-update-interval=1209600 --disable-session-crashed-bubble --disable-infobars --disable-restore-session-state --disable-features=TranslateUI --kiosk --disable-pinch --overscroll-history-navigation=0 --proxy-auto-detect $DYNAMIC_URL
}

cleanChromium
openUrl