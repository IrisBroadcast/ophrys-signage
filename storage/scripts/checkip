#!/bin/bash

function checkIp
{
    x=true
    while $x
        do
            _ip=$(hostname -I)
            oct1=$(echo ${_ip} | tr "." " " | awk '{ print $1 }')

            if [[ -z "$oct1" ]];then
                oct1=127
                echo $_ip
            fi
            if [[ $oct1 -ne 127  && $oct1 -ne 169 ]];then
                echo $_ip
                x=false
                break
            fi
        sleep 2
    done
}
checkIp