//////////////////////////////////////////////////////////////////////////////
// VIEWS PAGES

function fadeInPage()
{
    if (!window.AnimationEvent) { return; }
    var pagefader = document.getElementById('pagefader');
    pagefader.classList.add('fade-out');
}

document.addEventListener('DOMContentLoaded', function()
{
    if (!window.AnimationEvent) { return; }

    var anchors = document.getElementsByTagName('a');

    for (var idx = 0; idx < anchors.length; idx += 1)
    {
        if (anchors[idx].hostname !== window.location.hostname)
        {
            continue;
        }

        anchors[idx].addEventListener('click', function(event)
        {
            var pagefader = document.getElementById('pagefader'),
                anchor = event.currentTarget;

            var listener = function() {
                window.location = anchor.href;
                pagefader.removeEventListener('animationend', listener);
            };
            pagefader.addEventListener('animationend', listener);

            event.preventDefault();
            pagefader.classList.add('fade-in');
        });
    }
});

// For cache persistent webpages (Safari does it)
window.addEventListener('pageshow', function (event)
{
    if (!event.persisted) {
        return;
    }
    var pagefader = document.getElementById('pagefader');
    pagefader.classList.remove('fade-in');
});

fadeInPage();

//================
// Tab Blocks

var tabTimer = null;
var tabTimerTime = 1000;
var tabTimerDefaultTime = 15000;
var tabBlocks = 0;
var tabReload = false;

var doActionStartTabTimer = async function()
{
    if(tabTimer == null)
    {
        console.log("doActionStartTabTimer is starting");

        if (utils.elementExists("frame-widget-0") == false &&
            utils.elementExists("block-widget-0") == false)
        {
            doActionStopTabTimer();
            return;
        }

        let rem = 1;
        tabTimer = setTimeout(async function tabRun()
        {
            // Move on to the next iframe
            utils.getElem("frame-widget-" + rem).style.opacity = 1;

            // Set the one not in focus to opacity 0
            rem = rem == 1 ? 2 : 1;
            utils.getElem("frame-widget-" + rem).style.opacity = 0;

            // Reload iframe not in focus
            if(tabReload)
            {
                utils.getElem("frame-widget-" + rem).src = utils.getElem("frame-widget-" + rem).src;
            }

            tabTimerTime = tabTimerDefaultTime;

            tabTimer = setTimeout(tabRun, tabTimerTime);
        },
        tabTimerTime);
    }
    else
    {
        console.log("doActionStartTabTimer already started, restarting");
        doActionStopTabTimer();
        doActionStartTabTimer();
    }
}

var doActionStopTabTimer = async function()
{
    console.log("doActionStopTabTimer is stopping");
    if(tabTimer)
    {
        clearInterval(tabTimer);
        tabTimer = null;
    }
}

var doGetUrls = function()
{
    if(utils.getUrlParameters("delay"))
    {
        tabTimerDefaultTime = utils.getUrlParameters("delay") * 1000;
    }

    if(utils.getUrlParameters("reload"))
    {
        tabReload = utils.getUrlParameters("reload");
    }

    if(utils.getUrlParameters("bodybg"))
    {
        document.body.style.background = utils.getUrlParameters("bodybg");
    }

    if(utils.getUrlParameters("clock"))
    {
        utils.getElem("frame-clock").style.display = "block";
    }

    if(utils.getUrlParameters("bodypadding"))
    {
        utils.getElem("frame-widget-1").style.padding = utils.getUrlParameters("bodypadding");
        utils.getElem("frame-widget-2").style.padding = utils.getUrlParameters("bodypadding");
    }

    if(utils.getUrlParameters("url1"))
    {
        tabBlocks+=1;
        utils.getElem("frame-widget-1").src = "http://" + utils.getUrlParameters("url1");
        utils.getElem("frame-widget-2").src = "http://" + utils.getUrlParameters("url1");
    }

    if (tabBlocks == 0)
    {
        utils.domChange("frame-widget-feedback", "innerText", "No URL parameters found");
        return;
    }
    else {
        utils.getElem("frame-widget-0").style.display = "none";
    }

    doActionStartTabTimer();
}

doGetUrls();