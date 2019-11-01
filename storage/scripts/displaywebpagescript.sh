#!/bin/bash

COMMONFILE=/usr/local/aloe/scripts/common.sh
. $COMMONFILE

STATEFILENODE="/usr/local/aloe/scripts/ophrys_state_node.json"
FALLBACKFILE="/tmp/ophrys_state_node.json"

function checkFile
{
    ## Check if screenstatus.json exists, if not create a temporary file default url
    if [ ! -e $STATEFILENODE ];then
        cat <<EOT > $FALLBACKFILE
{
  "url": "http://localhost:82"
}
EOT
	STATEFILENODE=$FALLBACKFILE
    fi
}

function openUrl
{
	DYNAMIC_URL=$(cat $STATEFILENODE | jq -r '.url')
	BROWSERPARAMETER=$(cat $STATEFILENODE | jq -r '.browserparameter')
	CHROMEURL=$DYNAMIC_URL

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
	export DISPLAY=:0.0
	chromium-browser $BROWSERPARAMETER --noerrdialogs --incognito --kiosk --disable-pinch --overscroll-history-navigation=0 --proxy-auto-detect $CHROMEURL
}
checkFile
openUrl