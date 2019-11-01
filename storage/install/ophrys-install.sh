#!/bin/bash

#This is the init Ophrys script file that will run Whiptail

# -- User configured variables
USER_HTTP_PROXY=""
USER_HTTPS_PROXY=""
USER_HOSTNAME=""
USER_SSH_PASSWORD=""
# --

MAIN_CONFIGFOLDER="/usr/local/aloe/conf"
UNIQUE_USER_INPUTFILE="/usr/local/aloe/conf/userinput"
APTCONFIGFILE="/etc/apt/apt.conf"
ENVIRONMENTFILE="/etc/environment"
HOMEFOLDER="/usr/local/aloe/nodewebb"
GITREPO_LOCAL="/usr/local/aloe/nodewebb/OphrysSignage"
STORAGE_INSTALLFOLDER="/usr/local/aloe/nodewebb/OphrysSignage/storage/install"
GITREPO_REMOTE="https://github.com/IrisBroadcast/OphrysSignage.git"
COMPONENTFOLDER="/usr/local/aloe/nodewebb/OphrysSignage/storage/components"
INSTALLFOLDER="/usr/local/aloe/nodewebb/OphrysSignage/storage/install"
TEXT_PROGRESS="/tmp/text_progress"
NEWINSTALL="/tmp/newinstall"
INSTALL_LOG="/var/log/ophrys-full-install.log"
COMPONENTINSTALLFILE="ophrys-predependencies.sh"

# check if unique user config file exists
if [ -f $UNIQUE_USER_INPUTFILE ];then
    . $UNIQUE_USER_INPUTFILE
else
    # Create the unique user config file
    mkdir -p $MAIN_CONFIGFOLDER
    echo "# Ophrys - unique user config file" > $UNIQUE_USER_INPUTFILE
fi

# Make sure that apt config file exists
if [ ! -f $APTCONFIGFILE ];then
    echo "# Apt config" > $APTCONFIGFILE
fi

# -- WHIPTAIL START

function menuMain()
{
    ADVSEL=$(whiptail --title "Ophrys Signage Configuration Tool" --menu "Choose an option" 14 75 4 \
        "1" "Configure optional proxy settings" \
        "2" "Download and install Ophrys Signage (full install)" \
        "3" "Check for Ophrys Signage updates" \
        "4" "Advanced Settings" 3>&1 1>&2 2>&3)

    case $ADVSEL in
        1)
            menuBasicSettings
        ;;
        2)
            # Download and install Ophrys Signage (full install or reinstall)
            if (whiptail --title "Download and install Ophrys Signage" --yesno "Before installation, do you want to upgrade the operating system?
            \nAn upgrade may take several minutes but is highly recommended " 14 75 4); then
                # Check if ntp is running = if not try to set time
                if (! pgrep ntp);then
                    apt get install ntpdate
                    if [ $? == 0 ];then
                        ntpdate 0.pool.ntp.org 1.pool.ntp.org
                    fi
                else
                    apt-get update
                    apt-get upgrade -y
                fi
            else
                # Check if ntp is running = if not try to set time
                if (! pgrep ntp);then
                    apt get install ntpdate
                    if [ $? == 0 ];then
                        ntpdate 0.pool.ntp.org 1.pool.ntp.org
                    fi
                fi
            fi
        ;;
        3)
            # Check for Ophrys Signage updates
            whiptail --title "Check for Ophrys Signage updates" --msgbox "This function is not yet activated" 14 75 4
            menuMain
        ;;
        4)
            # Check for configuration tool update
            whiptail --title "Advanced Settings" --infobox "" 14 75 4
            menuAdvancedSettings
        ;;
        *)
            # exit application
            exit 0
        ;;
    esac
}

function menuBasicSettings()
{
    ADVSEL=$(whiptail --title "Ophrys Signage Configuration Tool" --menu "Configure proxy settings" 14 75 4 \
        "1" "HTTP - Proxy settings ($USER_HTTP_PROXY)" \
        "2" "HTTPS - Proxy settings ($USER_HTTPS_PROXY)" 3>&1 1>&2 2>&3)

    case $ADVSEL in
        1)
            CH_HTTPPROXY=$(whiptail --inputbox "Change proxy settings. Example: 'http://user:pwd@proxy.company.com:8080' (http), leave empty to not use:" 14 75 $USER_HTTP_PROXY --title "Change http proxy" 3>&1 1>&2 2>&3)
            USER_HTTP_PROXY=$CH_HTTPPROXY
            if [ $? -eq 0 ];then
                # Store correct values regading proxy in the unique user input file
                grep -q "USER_HTTP_PROXY" $UNIQUE_USER_INPUTFILE
                if [ $? -eq 0 ];then
                    sed -i "s|.*USER_HTTP_PROXY.*|USER_HTTP_PROXY=${CH_HTTPPROXY}|" $UNIQUE_USER_INPUTFILE
                else
                    sed -i -e "\$aUSER_HTTP_PROXY=${CH_HTTPPROXY}" $UNIQUE_USER_INPUTFILE

                fi
            fi

            # Make sure that http proxy is set
            if [ -n "$USER_HTTP_PROXY" ];then
                # APT proxy
                grep -q ":http_proxy:" $APTCONFIGFILE
                if [ $? -ne 0 ];then
                    echo "Acquire::http::Proxy \"$USER_HTTP_PROXY\";" >> $APTCONFIGFILE
                else
                    sed -i "s|.*:http_proxy:.*|Acquire::http::Proxy \"${CH_HTTPPROXY}\";|" $APTCONFIGFILE
                fi

                # Global proxy
                grep -q "http_proxy" $ENVIRONMENTFILE
                if [ $? -ne 0 ];then
                    echo "export http_proxy=$USER_HTTP_PROXY" >> $ENVIRONMENTFILE
                else
                    sed -i "s|.*http_proxy.*|export http_proxy=${CH_HTTPPROXY}|" $APTCONFIGFILE
                fi


            else
                grep -q "\:http\:" $APTCONFIGFILE
                if [ $? -eq 0 ];then
                    sed -i '/\:http\:/d' $APTCONFIGFILE
                fi
                grep -q "http_proxy" $ENVIRONMENTFILE
                if [ $? -eq 0 ];then
                    sed -i '/http_proxy/d' $ENVIRONMENTFILE
                fi
            fi

            menuBasicSettings
        ;;
        2)
            CH_HTTPSPROXY=$(whiptail --inputbox "Change proxy settings 'https://user:pwd@proxy.company.com:8080' (https), leave empty to not use:" 14 75 $USER_HTTPS_PROXY --title "Change https proxy" 3>&1 1>&2 2>&3)
            USER_HTTPS_PROXY=$CH_HTTPSPROXY
            if [ $? -eq 0 ];then

                # Store correct values regarding proxy in the unique user input file
                grep -q "USER_HTTPS_PROXY" $UNIQUE_USER_INPUTFILE
                if [ $? -eq 0 ];then
                    sed -i "s|.*USER_HTTPS_PROXY.*|USER_HTTPS_PROXY=${CH_HTTPSPROXY}|" $UNIQUE_USER_INPUTFILE
                else
                    sed -i -e "\$aUSER_HTTPS_PROXY=${CH_HTTPSPROXY}" $UNIQUE_USER_INPUTFILE
                fi

            fi

            # Make sure that https proxy is set
            if [ -n "$USER_HTTPS_PROXY" ];then
                # APT proxy
                grep -q ":https_proxy:" $APTCONFIGFILE
                if [ $? -ne 0 ];then
                    echo "Acquire::https::Proxy \"$USER_HTTPS_PROXY\";" >> $APTCONFIGFILE
                else
                    sed -i "s|.*:https_proxy:.*|Acquire::https::Proxy \"${CH_HTTPSPROXY}\";|" $APTCONFIGFILE
                fi

                # Global proxy
                grep -q "https_proxy" $ENVIRONMENTFILE
                if [ $? -ne 0 ];then
                    echo "export https_proxy=$USER_HTTPS_PROXY" >> $ENVIRONMENTFILE
                else
                    sed -i "s|.*https_proxy.*|export https_proxy=${CH_HTTPPROXY}|" $APTCONFIGFILE
                fi


            else
                grep -q "\:https\:" $APTCONFIGFILE
                if [ $? -eq 0 ];then
                    sed -i '/\:https\:/d' $APTCONFIGFILE
                fi
                grep -q "https_proxy" $ENVIRONMENTFILE
                if [ $? -eq 0 ];then
                    sed -i '/https_proxy/d' $ENVIRONMENTFILE
                fi
            fi
            menuBasicSettings
        ;;
        *)
            # Return back to main menu on cancel
            menuMain
        ;;
    esac
}

function menuAdvancedSettings()
{
    ADVSEL=$(whiptail --title "Ophrys Signage Configuration Tool" --menu "Configure advanced settings" 14 75 4 \
        "1" "Change Hostname $(hostname)" \
        "2" "Change SSH password" 3>&1 1>&2 2>&3)

    case $ADVSEL in
        1)
            # Change hostname
            CH_HOSTNAME=$(whiptail --inputbox "Change hostname:" 14 75 $(hostname) --title "Change hostname" 3>&1 1>&2 2>&3)
            if [ $? -eq 0 ];then
                FILE=/etc/hosts
                echo $CH_HOSTNAME > /etc/hostname > /dev/null

                grep -q "127.0.1.1" $FILE
                if [ $? -eq 0 ];then
                    sed -i '/127.0.1.1/d' $FILE
                    echo "127.0.1.1       $CH_HOSTNAME" >> $FILE
                fi
                hostnamectl set-hostname "$CH_HOSTNAME"
                systemctl restart avahi-daemon

                echo "New hostname set: $(hostname)"
                # Save new hostname to the unique user config file
                grep -q "USER_HOSTNAME" $UNIQUE_USER_INPUTFILE
                if [ $? -eq 0 ];then
                    sed -i "s|.*USER_HOSTNAME.*|USER_HOSTNAME=${CH_HOSTNAME}|" $UNIQUE_USER_INPUTFILE
                else
                    sed -i -e "\$aUSER_HOSTNAME=${CH_HOSTNAME}" $UNIQUE_USER_INPUTFILE
                fi
            fi

            menuAdvancedSettings
        ;;
        2)
            # SSH Password
            CH_SSHPASSWORD=$(whiptail --passwordbox "Change SSH password:" 8 78 --title "Change SSH password" 3>&1 1>&2 2>&3)
            # Save new password to the unique user config file
            if [ $? -eq 0 ];then
                grep -q "USER_SSH_PASSWORD" $UNIQUE_USER_INPUTFILE
                if [ $? -eq 0 ];then
                    sed -i "s|.*USER_SSH_PASSWORD.*|USER_SSH_PASSWORD=${CH_SSHPASSWORD}|" $UNIQUE_USER_INPUTFILE
                else
                    sed -i -e "\$aUSER_SSH_PASSWORD=${CH_SSHPASSWORD}" $UNIQUE_USER_INPUTFILE
                fi
            fi
            menuAdvancedSettings
        ;;
        *)
            # Return back to main menu on cancel
            menuMain
        ;;
    esac
}
menuMain


## PART TWO - Install initiated


# Making sure all files needed exists and that they are read
if [ -f $UNIQUE_USER_INPUTFILE ];then
    . $UNIQUE_USER_INPUTFILE
fi

if [ ! -f $TEXT_PROGRESS ];then
    echo "MSG=\"Installation is running .. preparing\"" > $TEXT_PROGRESS
fi

# Clean install log
echo "" > $INSTALL_LOG

# A temp file used to verify that this is an ongoing full new install
echo "" > $NEWINSTALL

function updateOs
{
    # Running an apt update to make sure latest packages lists are downloaded
    MSG="Downloading latest package list (apt update)"
    INSTALLPROGRESS=3

    apt-get update &>> $INSTALL_LOG
}

function installNtp
{
    # Making sure NTP is installed
    MSG="Making sure NTP (Network Time Protocol) is installed"
    INSTALLPROGRESS=5

    apt-get -y install ntp &>> $INSTALL_LOG
}

function installGit
{
    # Install pre-dependencies: GIT
    MSG="Install pre-dependencies: GIT"
    INSTALLPROGRESS=10

    apt-get install git -y &>> $INSTALL_LOG
}

function setGitProxy
{
    # Checking git proxy settings
    MSG="Checking git proxy settings"
    INSTALLPROGRESS=15

    if [ -n "$USER_HTTP_PROXY" ];then
        git config --global http.proxy $USER_HTTP_PROXY
    else
        git config --global --unset http.proxy
    fi

    if [ -n "$USER_HTTPS_PROXY" ];then
        git config --global https.proxy $USER_HTTPS_PROXY
    else
        git config --global --unset https.proxy
    fi
}

function getOphrysSignageApplication
{
    # Get Ophrys signage
    MSG="Downloading Ophrys signage application"
    INSTALLPROGRESS=20

    if [ -d $HOMEFOLDER ];then
        rm -r $HOMEFOLDER
    fi

    mkdir -p $HOMEFOLDER
    cd $HOMEFOLDER
    git clone $GITREPO_REMOTE &>> $INSTALL_LOG
}

function gaugeMeterShowingInstallProgress()
{
    INSTALLPROGRESS=1
    for var in "$@"
    do
        $var
        echo XXX
        echo $INSTALLPROGRESS
        echo ${MSG[i1]}
        echo XXX
        sleep 3;
    done | whiptail --title "Ophrys Signage" --gauge "Installation is running" 8 70 1
    sleep 2
}

gaugeMeterShowingInstallProgress updateOs installNtp installGit setGitProxy getOphrysSignageApplication
cp $INSTALLFOLDER/$COMPONENTINSTALLFILE /tmp/$COMPONENTINSTALLFILE
cd /tmp
bash $COMPONENTINSTALLFILE