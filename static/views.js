//////////////////////////////////////////////////////////////////////////////
// VIEWS PAGES

function fadeInPage() {
    if (!window.AnimationEvent) { return; }
    var pagefader = document.getElementById('pagefader');
    pagefader.classList.add('fade-out');
}

document.addEventListener('DOMContentLoaded', function() {
    if (!window.AnimationEvent) { return; }

    var anchors = document.getElementsByTagName('a');

    for (var idx = 0; idx < anchors.length; idx += 1) {
        if (anchors[idx].hostname !== window.location.hostname) {
            continue;
        }

        anchors[idx].addEventListener('click', function(event) {
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
window.addEventListener('pageshow', function (event) {
    if (!event.persisted) {
        return;
    }
    let pagefader = document.getElementById('pagefader');
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

var doActionStartTabTimer = async function() {
    if (tabTimer == null) {
        console.log("doActionStartTabTimer is starting");

        if (utils.elementExists("frame-widget-0") == false &&
            utils.elementExists("block-widget-0") == false) {
            doActionStopTabTimer();
            return;
        }

        if (tabBlocks == 1) {
            utils.getElem("frame-widget-1").scrollIntoView({
                behavior: 'auto'
            });
            return;
        } else {
            utils.getElem("frame-widget-0").scrollIntoView({
                behavior: 'auto'
            });
        }

        let i = 1;
        tabBlocks+=1;
        tabTimer = setTimeout(async function tabRun() {
            // Reload iframe not in focus
            if (tabReload) {
                utils.getElem("frame-widget-" + ( (i+1) % tabBlocks)).src = utils.getElem("frame-widget-" + ( (i+1) % tabBlocks)).src;
            }

            // Move on to the next iframe
            if ((i % tabBlocks) == 0) {
                tabTimerTime = 1000;
                utils.getElem("frame-widget-" + ( i % tabBlocks)).scrollIntoView({
                    behavior: 'auto'
                });
            } else {
                tabTimerTime = tabTimerDefaultTime;
                utils.getElem("frame-widget-" + ( i % tabBlocks)).scrollIntoView({
                    behavior: 'smooth'
                });
            }

            // Increase loop count
            i+=1;

            tabTimer = setTimeout(tabRun, tabTimerTime);
        },
        tabTimerTime);
    } else {
        console.log("doActionStartTabTimer already started, restarting");
        doActionStopTabTimer();
        doActionStartTabTimer();
    }
}

var doActionStopTabTimer = async function() {
    console.log("doActionStopTabTimer is stopping");
    if (tabTimer) {
        clearInterval(tabTimer);
        tabTimer = null;
    }
}

var doGetUrls = function() {
    if (utils.getUrlParameters("delay")) {
        tabTimerDefaultTime = utils.getUrlParameters("delay") * 1000;
    }

    if (utils.getUrlParameters("reload")) {
        tabReload = utils.getUrlParameters("reload");
    }

    if (utils.getUrlParameters("viewid")) {
        fetch('/view/getconfig')
            .then((response) => {
                return response.json();
            })
            .then((config) => {
                if(config.hasOwnProperty("url1"))
                {
                    tabBlocks+=1;
                    utils.getElem("frame-widget-1").src = config.url1;
                    utils.getElem("block-widget-1").src = config.url1;
                }
                if(config.hasOwnProperty("url2"))
                {
                    tabBlocks+=1;
                    utils.getElem("frame-widget-2").src = config.url2;
                    utils.getElem("block-widget-2").src = config.url2;
                }
                if(config.hasOwnProperty("url3"))
                {
                    tabBlocks+=1;
                    utils.getElem("frame-widget-3").src = config.url3;
                }

                if (tabBlocks == 0)
                {
                    utils.domChange("frame-widget-feedback", "innerText", "No URL view configuration parameters found");
                    utils.domChange("block-widget-feedback", "innerText", "No URL view configuration parameters found");
                    return;
                }
                else {
                    utils.getElem("block-widget-0").style.display = "none";
                }

                doActionStartTabTimer();
            });
    }
    else
    {
        if(utils.getUrlParameters("url1"))
        {
            tabBlocks+=1;
            utils.getElem("frame-widget-1").src = "http://" + utils.getUrlParameters("url1");
            utils.getElem("block-widget-1").src = "http://" + utils.getUrlParameters("url1");
        }
        if(utils.getUrlParameters("url2"))
        {
            tabBlocks+=1;
            utils.getElem("frame-widget-2").src = "http://" + utils.getUrlParameters("url2");
            utils.getElem("block-widget-2").src = "http://" + utils.getUrlParameters("url2");
        }
        if(utils.getUrlParameters("url3"))
        {
            tabBlocks+=1;
            utils.getElem("frame-widget-3").src = "http://" + utils.getUrlParameters("url3");
        }

        if (tabBlocks == 0)
        {
            utils.domChange("frame-widget-feedback", "innerText", "No URL parameters found");
            utils.domChange("block-widget-feedback", "innerText", "No URL parameters found");
            return;
        }
        else {
            utils.getElem("block-widget-0").style.display = "none";
        }

        doActionStartTabTimer();
    }
}

doGetUrls();