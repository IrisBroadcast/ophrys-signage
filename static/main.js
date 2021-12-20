//////////////////////////////////////////////////////////////////////////////
// UTILITY GENERAL TOOLS
var util = function() {
    return {
        getElem: function(id)
        {
            if (id!==null && id!=="" && id!==undefined)
            {
                try {
                    if(document.getElementById(id) !== null)
                    {
                        return document.getElementById(id);
                    }
                    else
                    {
                        console.warn("Can't access element with id: "+id);
                        return document.createElement("div");
                    }
                }
                catch(e) {
                    console.warn("Can't access element with id: "+id);
                    return document.createElement("div");
                }
            }
            else
            {
                console.warn("Can't access element with id: "+id);
                return document.createElement("div");
            }
        },
        domChange: function(el, key, value)
        {
            if(typeof el !== 'object')
            {
                el = this.getElem(el);
            }
            if(el[key] !== value)
            {
                window.requestAnimationFrame(
                    function() {
                        el[key] = value;
                    }
                );
            }
        },
        domChangeClass: function(el, key, value)
        {
            var x = document.getElementsByClassName(el);
            for (var i = 0; i < x.length; i++) {
                this.domChange(x[i], key, value);
            }
        },
        domChangeByAttr: (key, value, html) => {
            // Updates every element with the 'data-key' attribute
            html = html || false;
            try {
                let languageTemplate = document.querySelectorAll("[data-key]");
                if (html) {
                    languageTemplate.forEach(function(item) {
                        if (item.dataset.key === key) {
                            window.requestAnimationFrame(function() {
                                item.innerHTML = value;
                            });
                        }
                    });
                } else {
                    languageTemplate.forEach(function(item) {
                        if (item.dataset.key === key) {
                            window.requestAnimationFrame(function() {
                                item.textContent = value;
                            });
                        }
                    });
                }
                return true;
            } catch(e) {
                console.error(e);
                return false;
            }
        },
        getProperty: function(el, key)
        {
            if(typeof el !== 'object')
            {
                el = this.getElem(el);
            }
            return el[key];
        },
        elementExists: function(id)
        {
            if (id !== null && id !== "" && id !== undefined)
            {
                try {
                    if(document.getElementById(id) !== null)
                    {
                        return true;
                    }
                    else {
                        console.warn("Element with id: "+id+" doesn't exist.");
                        return false;
                    }
                }
                catch(e) {
                    console.warn("Element with id: "+id+" doesn't exist.");
                    return false;
                }
            }
            else
            {
                console.warn("Element with id: "+id+" doesn't exist.");
                return false;
            }
        },
        addEvent: function(el, evnt, funct)
        {
            if (el == null)
            {
                return;
            }
            if(typeof el !== 'object')
            {
                el = this.getElem(el);
            }
            if (el.attachEvent)
            {
                return el.attachEvent("on" + evnt, funct);
            }
            else
            {
                return el.addEventListener(evnt, funct, false);
            }
        },
        removeAllChildren: function(node)
        {
            while (node.hasChildNodes())
            {
                node.removeChild(node.lastChild);
            }
        },
        isDescendant: function(parent, child)
        {
            if (child==null)
            {
                return false;
            }
            var node = child.parentNode;
            while (node != null)
            {
                if (node == parent)
                {
                    return true;
                }
                node = node.parentNode;
            }
            return false;
        },
        setCookie: function(cname, cvalue, exdays)
        {
            var d = new Date();
            d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
            var expires = "expires="+d.toUTCString();
            document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
        },
        getCookie: function(cname)
        {
            var name = cname + "=";
            var ca = document.cookie.split(';');
            for(var i = 0; i < ca.length; i++)
            {
                var c = ca[i];
                while (c.charAt(0) == ' ')
                {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0)
                {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        },
        checkCookie: function(cname)
        {
            var user = this.getCookie(cname);
            if (user != "" && user != null)
            {
                return true;
            }
            else
            {
                return false;
            }
        },
        getUrlParameters: function(name, url)
        {
            if (!url)
            {
                url = window.location.href;
            }
            url = url.toLowerCase();
            name = name.replace(/[\[\]]/g, '\\$&').toLowerCase();
            var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
            var results = regex.exec(url);
            if (!results)
            {
                return null;
            }
            if (!results[2])
            {
                return '';
            }
            return decodeURIComponent(results[2].replace(/\+/g, ' '));
        },
        cleanSipUriToDisplayname: function(sip)
        {
            return sip.toString().split('@')[0].split("-").join(" ").split("_").join(" ").replace("sip:", "").trim();
        },
        bytesToGb: function(bytes)
        {
            if (bytes==null) return 0;
            if (!bytes) return bytes;

            if (isNaN(bytes) || bytes < 1 || bytes == 0)
            {
                return '0 GB';
            }
            else
            {
                var k = 10,
                    i = 9;
                return parseFloat((bytes / Math.pow(k, i)).toFixed(3)) + ' GB';
            }
        },
        convertRange: function(value, returnPercent)
        {
            if (value===null && value===undefined)
            {
                return 0;
            }
            var yMax = 0,
                yMin = -94; // -128 actual limit

            if (value <= -94)
            {
                value = -94
            }

            var percent = (value - yMin) / (yMax - yMin);

            if (returnPercent === undefined || returnPercent)
            {
                return percent * 100;//((xMax - xMin) + xMin); var xMax = 100; var xMin = 1;
            }
            else
            {
                return percent.toFixed(2);
            }
        },
        debounce: function(func, wait, immediate)
        {
            var timeout;
            return function() {
                var context = this,
                    args = arguments;
                var later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        },
        formatDateTime: function(incoming, onlytime)
        {
            onlytime = onlytime || false;
            var date = new Date(incoming);
            var dd = (date.getDate() < 10 ? '0' : '') + date.getDate();
            var MM = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1);
            var yyyy = date.getFullYear();

            var hours = (date.getHours() < 10 ? '0' : '') + date.getHours();
            var minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
            var seconds = (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
            var milli = date.getMilliseconds();

            if(onlytime)
            {
                return (hours + ":" + minutes + ":" + seconds);
            }
            else
            {
                return (yyyy + "-" + MM + "-" + dd + " " + hours + ":" + minutes + ":" + seconds + ":" + milli);
            }
        },
        millisToTime: function(millis)
        {
            var day, hour, minute, seconds;
            seconds = Math.floor((millis % 60000) / 1000);
            minute = Math.floor(millis / 60000);

            hour = Math.floor(minute / 60);
            minute = seconds == 60 ? minute + 1 : minute;
            minute = Math.floor((millis/(1000*60))%60)

            day = Math.floor(hour / 24);
            hour = hour % 24;
            return {
                day: day,
                hour: hour,
                minute: minute,
                seconds: seconds
            };
        },
        isEmptyOrUndefined: function(str)
        {
            if (typeof str === 'undefined' || typeof str === undefined)
            {
                return true;
            }
            else if (str == "")
            {
                return true;
            }
            else
            {
                return false;
            }
        },
        isObjectEmpty: function(obj)
        {
            if (typeof obj !== 'object')
            {
                return false;
            }
            else if(obj === null)
            {
                return true;
            }
            else {
                return (Object.keys(obj).length === 0 && obj.constructor === Object);
            }
        },
        addClass: function(el, cssClass)
        {
            if(typeof el !== 'object')
            {
                el = this.getElem(el);
            }
            if (! el.classList.contains(cssClass))
            {
                el.classList.add(cssClass);
            }
        },
        removeClass: function(el, cssClass)
        {
            if(typeof el !== 'object')
            {
                el = this.getElem(el);
            }
            if (el.classList.contains(cssClass))
            {
                el.classList.remove(cssClass);
            }
        },
        addClassFromClass: function(el, cssClass)
        {
            var x = document.getElementsByClassName(el);
            for (var i = 0; i < x.length; i++) {
                this.addClass(x[i], cssClass);
            }
        },
        removeClassFromClass: function(el, cssClass)
        {
            var x = document.getElementsByClassName(el);
            for (var i = 0; i < x.length; i++) {
                this.removeClass(x[i], cssClass);
            }
        }
    }
}

//////////////////////////////////////////////////////////////////////////////
// INITIATE
const utils = new util();

//////////////////////////////////////////////////////////////////////////////
// CONFIGURATION
const socket = io()

socket.on('connect', function() {
    console.log('* Connected', socket.connected);
    utils.getElem('logo-image').classList.add('status-socket-connected')
    utils.getElem('logo-image').classList.remove('status-socket-disconnected')
});

socket.on('disconnect', function() {
    console.log('* Connected', socket.connected);
    utils.getElem('logo-image').classList.remove('status-socket-connected')
    utils.getElem('logo-image').classList.add('status-socket-disconnected')
});

// Save items to configuration file
utils.addEvent("save-config-btn", "click", function(event) {
    event.preventDefault();
    let formdata = {}
    formdata.title = utils.getProperty("input-title", "value");
    formdata.description = utils.getProperty("input-description", "value");
    formdata.url = utils.getProperty("input-current_url", "value");
    formdata.browserparameter = utils.getProperty("input-browser_parameter", "value");
    formdata.fetchconfig = utils.getProperty("input-fetch_config_from_url", "checked");
    formdata.remoteurl = utils.getProperty("input-remote_config_url", "value");

    if (utils.getProperty("input-screen_rotation--normal", "checked")) {
        formdata.rotation = "normal";
    } else if(utils.getProperty("input-screen_rotation--left", "checked")) {
        formdata.rotation = "left";
    } else if(utils.getProperty("input-screen_rotation--right", "checked")) {
        formdata.rotation = "right";
    } else if(utils.getProperty("input-screen_rotation--inverted", "checked")) {
        formdata.rotation = "inverted";
    }

    console.log("Sent:", formdata);
    socket.emit('save config-options', formdata);
    return false;
});

// Save items to view-data file
utils.addEvent("save-view-data-btn", "click", function(event) {
    event.preventDefault();
    const formdata = {}
    formdata.view = utils.getProperty("input-view", "value");
    formdata.html = utils.getProperty("input-html", "value");
    formdata.script = utils.getProperty("input-script", "value");
    formdata.url1 = utils.getProperty("input-url1", "value");
    formdata.url2 = utils.getProperty("input-url2", "value");
    formdata.url3 = utils.getProperty("input-url3", "value");

    console.log("Sent:", formdata);
    socket.emit('save config-view-data', formdata);
    return false;
});

// Refresh webpage
utils.addEvent("reload-url-btn", "click", function(event)
{
    event.preventDefault();
    socket.emit('user-action--reload-browser');
    alert('Reloading URL');
    return false;
});

// Toggle configuration form elements visibility
utils.addEvent("input-fetch_config_from_url", "click", function()
{
    if (utils.getProperty("input-fetch_config_from_url", "checked"))
    {
        setFeatureRemoteConfig(true);
    }
    else
    {
        setFeatureRemoteConfig(false);
    }
});

function setFeatureRemoteConfig(value) {
    utils.domChangeClass("feature--remote-config", "disabled", !value);
    utils.domChangeClass("feature--local-config", "disabled", value);

    if (value) {
        utils.addClassFromClass("feature--remote-config-info", "feature--remote-config-info--show");
        utils.removeClassFromClass("feature--local-config-info", "feature--local-config-info--show");
    } else {
        utils.addClassFromClass("feature--local-config-info", "feature--local-config-info--show");
        utils.removeClassFromClass("feature--remote-config-info", "feature--remote-config-info--show");
    }
}

// Get system info from server
socket.on("system-status", function(msg) {
    console.log("system-status");
    console.table(msg);
    let deviceAddress = "";
    if (msg.hasOwnProperty("ip")) {
        deviceAddress = msg.ip[0];
    }

    if (msg.hasOwnProperty("hostname")) {
        deviceAddress = msg.hostname;
    }

    utils.domChangeByAttr("info-device-ip", deviceAddress + ":" + msg.sitePort);

    /*data.cpus = os.cpus()
    data.memoryfree = os.freemem()
    data.memorytotal = os.totalmem()
    data.arch = os.arch() //x32, x64
    data.platform = os.platform()*/
});

// Get information about the remote fetch loop
socket.on("config-external-timer", function(msg)
{
    console.log("Recieved config-external-timer:");
    console.table(msg);
    var feedback = "Remote config check is not running";
    if(msg.timer)
    {
        feedback = "Remote config check is running (" + msg['loop-count'] + ")";
    }
    utils.getElem("infoRemoteConfigTimer").innerText = feedback;
    utils.getElem("infoRemoteConfigError").innerText = msg.error;
});

// Get local configfile from server
socket.on("config-options", function(msg) {
    console.log("Received config-options:");
    console.table(msg);
    if (msg != null) {
        // Set title
        if (msg.hasOwnProperty("title")) {
            utils.domChange("input-title", "value", msg.title);
            utils.domChange("infoCurrentUrl", "innerText", (msg.title || "Ophrys Signage"));
        }

        // Set description
        if (msg.hasOwnProperty("description")) {
            utils.domChange("input-description", "value", msg.description);
        }

        // Set current url to form and info fields
        if (msg.hasOwnProperty("url")) {
            utils.domChange("input-current_url", "value", msg.url);
        }

        // Set up browser startup parameters
        if (msg.hasOwnProperty("browserparameter")) {
            utils.domChange("input-browser_parameter", "value", msg.browserparameter);
        }

        // Auto get configuration from url
        if (msg.hasOwnProperty("fetchconfig")) {
            utils.domChange("input-fetch_config_from_url", "checked", msg.fetchconfig);
            setFeatureRemoteConfig(msg.fetchconfig);
        } else {
            setFeatureRemoteConfig(false);
        }

        // Fetch configuration from this url
        if (msg.hasOwnProperty("remoteurl")) {
            utils.domChange("input-remote_config_url", "value", msg.remoteurl);
        }

        // Set screen_rotation
        if (msg.hasOwnProperty("rotation")) {
            if(msg.rotation == "normal") {
                utils.domChange("input-screen_rotation--normal", "checked", true);
            } else if(msg.rotation == "left") {
                utils.domChange("input-screen_rotation--left", "checked", true);
            } else if(msg.rotation == "right") {
                utils.domChange("input-screen_rotation--right", "checked", true);
            } else if(msg.rotation == "inverted") {
                utils.domChange("input-screen_rotation--inverted", "checked", true);
            }
        }
    }
});

// Get local statefile from server
socket.on("config-options--state", function(msg) {
    console.log("Recieved config-options--state:")
    console.table(msg);
    if (msg != null) {
        // Set current url to form and info fields
        if (msg.hasOwnProperty("url")) {
            utils.domChange("infoCurrentUrl", "innerText", msg.url);
        }

        // Set screen_rotation
        if (msg.hasOwnProperty("rotation")) {
            utils.removeClass("input-screen_rotation--normal-rlbl", "radiobtn-box--confirmed");
            utils.removeClass("input-screen_rotation--left-rlbl", "radiobtn-box--confirmed");
            utils.removeClass("input-screen_rotation--right-rlbl", "radiobtn-box--confirmed");
            utils.removeClass("input-screen_rotation--inverted-rlbl", "radiobtn-box--confirmed");

            if (msg.rotation == "normal") {
                utils.addClass("input-screen_rotation--normal-rlbl", "radiobtn-box--confirmed");
            } else if (msg.rotation == "left") {
                utils.addClass("input-screen_rotation--left-rlbl", "radiobtn-box--confirmed");
            } else if (msg.rotation == "right") {
                utils.addClass("input-screen_rotation--right-rlbl", "radiobtn-box--confirmed");
            } else if (msg.rotation == "inverted") {
                utils.addClass("input-screen_rotation--inverted-rlbl", "radiobtn-box--confirmed");
            }
        }

        // Set hardware model
        if (msg.hasOwnProperty("hardwaremodel")) {
            utils.domChange("infoHardware", "innerText", msg.hardwaremodel);
        }

        // Set hostname
        if (msg.hasOwnProperty("hostname")) {
            utils.domChange("infoHostName", "innerText", msg.hostname);
        }
    }
});

// Get local view-data from server
var LOCAL_INFO = "";
var LOCAL_SCRIPT = "";
var LOCAL_STORE = "";
socket.on("config-options--view-data", function(msg) {
    console.log("Received config-options--view-data:")
    console.table(msg);
    if (msg != null) {

        if (Array.isArray(msg) === false) {
            msg = [msg];
        }

        for (let x = 0; x < msg.length; x++) {
            // View Id
            if (msg.hasOwnProperty("view")) {
                utils.domChange("input-view", "value", msg.view);
                utils.domChangeByAttr("info-conf-viewid", msg.view);
            }

            // Html
            if (msg.hasOwnProperty("html")) {
                utils.domChange("input-html", "value", msg.html);
                if (LOCAL_INFO !== msg.html) {
                    utils.domChange("popupLocalInformation", "innerHTML", msg.html);
                    LOCAL_INFO = msg.html;
                }
            }

            // Javascript
            if (msg.hasOwnProperty("script")) {
                utils.domChange("input-script", "value", msg.script);
                if (LOCAL_SCRIPT !== msg.script && utils.elementExists("customPage")) {
                    LOCAL_SCRIPT = msg.script;
                    setTimeout(function() {
                        if (utils.elementExists("customScriptTag")) {
                            const oldScriptElement = utils.getElem(customScriptTag);
                            utils.removeAllChildren(oldScriptElement);
                        }
                        let scriptElement = document.createElement("script");
                        scriptElement.id = "customScriptTag";
                        scriptElement.type = "text/javascript";
                        scriptElement.innerHTML = msg.script;
                        document.body.appendChild(scriptElement);
                    }, 5000)
                }
            }

            // URL1
            if (msg.hasOwnProperty("url1")) {
                utils.domChange("input-url1", "value", msg.url1);
            }

            // URL2
            if (msg.hasOwnProperty("url2")) {
                utils.domChange("input-url2", "value", msg.url2);
            }

            // URL3
            if (msg.hasOwnProperty("url3")) {
                utils.domChange("input-url3", "value", msg.url3);
            }

            // Setup listeners for change in form effects
            utils.addEvent("input-view", "input", (el) => {
                console.log("input-view on change: ", el.target.value);
                utils.domChangeByAttr("info-conf-viewid", el.target.value);
            });
        }
    }
});

// Get local custom variables for view/info
socket.on("config-options--custom-variables", function(msg) {
    console.log("Received config-options--custom-variables:")
    console.table(msg);

    if (msg != null && utils.elementExists("customPage")) {
        if (LOCAL_SCRIPT !== msg.script) {
            // Store a copy
            LOCAL_STORE = msg;

            // Get all keys and find mathing DOM-partner
            var keys = Object.keys(msg);

            setTimeout(function() {
                for (var i = 0; i < keys.length; i++)
                {
                    console.log("Keys:",keys[i], "Value:",msg[keys[i]]);
                    utils.domChange(keys[i], "innerHTML", msg[keys[i]]);
                }
            }, 2000);
        }
    }
});

//////////////////////////////////////////////////////////////////////////////
// VIEW AND NICE TO HAVE THINGS

// Clock
if(utils.elementExists("overlayFeedbackLocalClock")) {
    (function() {
        // Initial
        const secondBall = utils.getElem("hand-sec-ball");
        const marksSeconds = utils.getElem("marks-seconds");

        const $time_hours = utils.getElem("hours");
        const $time_minutes = utils.getElem("minutes");
        const $time_seconds = utils.getElem("seconds");
        const $time_full = utils.getElem("fulltime");

        // Initial
        for (let ii = 0; ii < 60; ii++) {
            var deg = ii*6;
            var lline = document.createElementNS("http://www.w3.org/2000/svg", "line");
            lline.setAttribute("class", "secondMark");
            lline.setAttribute("id", "secondMark"+deg);
            lline.setAttribute("x1", "0");
            lline.setAttribute("y1", "-46");
            lline.setAttribute("x2", "0");
            lline.setAttribute("y2", "-46");
            lline.setAttribute("stroke-linecap", "round");
            lline.setAttribute("stroke-width", "2");
            lline.setAttribute('transform', 'rotate(' + deg + ' 0 0)');
            lline.setAttribute("stroke", "#ff0000");
            lline.setAttribute("opacity", "0.1");
            marksSeconds.appendChild(lline);

            if((6 * new Date().getSeconds()) >= deg) {
                utils.getElem("secondMark"+deg).setAttribute("opacity", "1");
            }
        }

        const now = new Date();
        secondBall.setAttribute('transform', 'rotate(' + 6 * now.getSeconds() + ' 0 0)');

        function pad(number) {
            if (number < 10) return "0" + number;
            else return "" + number;
        }

        function rot(el, deg) {
            //el.setAttribute('transform', 'rotate(' + deg + ' 0 0)');

            if (el.id == "hand-sec-ball")
            {
                // Reset face
                if (deg == 0)
                {
                    const elems = document.getElementsByClassName("secondMark");
                    for (let bb = 0; bb < 60; bb++)
                    {
                        elems["secondMark"+bb*6].setAttribute("opacity", "0.1");
                    }
                }
                utils.getElem("secondMark"+deg).setAttribute("opacity", "1");
            }
        }

        function draw(timestamp) {
            const now = new Date();
            rot(secondBall, 6 * now.getSeconds());
            const tmpHour = pad(now.getHours());
            if ($time_hours.textContent !== tmpHour) {
                $time_hours.textContent = tmpHour;
            }
            const tmpMin = pad(now.getMinutes());
            if ($time_minutes.textContent !== tmpMin) {
                $time_minutes.textContent = tmpMin;
            }
            $time_seconds.textContent = pad(now.getSeconds());
            $time_full.innerHTML = now;

            window.requestAnimationFrame(draw);
        }

        window.requestAnimationFrame(draw);
    })();
}

// Clock
if(utils.elementExists("overlayAdvancedClock")) {
    (function() {
        // Initial
        const secondBall = utils.getElem("hand-sec-ball");
        const marksSeconds = utils.getElem("marks-seconds");

        const $time_hours = utils.getElem("hours");
        const $time_minutes = utils.getElem("minutes");
        const $time_seconds = utils.getElem("seconds");
        const $time_full = utils.getElem("fulltime");

        const $time_hours_utc = utils.getElem("hours-utc");
        const $time_minutes_utc = utils.getElem("minutes-utc");
        const $time_seconds_utc = utils.getElem("seconds-utc");

        // Initial
        for (let ii = 0; ii < 60; ii++) {
            var deg = ii*6;
            var lline = document.createElementNS("http://www.w3.org/2000/svg", "line");
            lline.setAttribute("class", "secondMark");
            lline.setAttribute("id", "secondMark"+deg);
            lline.setAttribute("x1", "0");
            lline.setAttribute("y1", "-46");
            lline.setAttribute("x2", "0");
            lline.setAttribute("y2", "-46");
            lline.setAttribute("stroke-linecap", "round");
            lline.setAttribute("stroke-width", "2");
            lline.setAttribute('transform', 'rotate(' + deg + ' 0 0)');
            lline.setAttribute("stroke", "#ff0000");
            lline.setAttribute("opacity", "0.1");
            marksSeconds.appendChild(lline);

            if((6 * new Date().getSeconds()) >= deg) {
                utils.getElem("secondMark"+deg).setAttribute("opacity", "1");
            }
        }

        const now = new Date();
        secondBall.setAttribute('transform', 'rotate(' + 6 * now.getSeconds() + ' 0 0)');

        function pad(number) {
            if (number < 10) return "0" + number;
            else return "" + number;
        }

        function rot(el, deg) {
            //el.setAttribute('transform', 'rotate(' + deg + ' 0 0)');

            if (el.id == "hand-sec-ball")
            {
                // Reset face
                if (deg == 0)
                {
                    const elems = document.getElementsByClassName("secondMark");
                    for (let bb = 0; bb < 60; bb++)
                    {
                        elems["secondMark"+bb*6].setAttribute("opacity", "0.1");
                    }
                }
                utils.getElem("secondMark"+deg).setAttribute("opacity", "1");
            }
        }

        function draw(timestamp) {
            const now = new Date();
            const utc_timestamp = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate() , now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
            const utc_date = new Date(utc_timestamp);
            rot(secondBall, 6 * now.getSeconds());

            // console.log(utc_timestamp)
            // var timezone =  now.getTimezoneOffset()
            // console.log(timezone)
            const tmpHour = pad(now.getHours());
            if ($time_hours.textContent !== tmpHour) {
                $time_hours.textContent = tmpHour;
            }
            const tmpMin = pad(now.getMinutes());
            if ($time_minutes.textContent !== tmpMin) {
                $time_minutes.textContent = tmpMin;
                $time_minutes_utc.textContent = tmpMin;
            }
            $time_seconds.textContent = pad(now.getSeconds());
            $time_seconds_utc.textContent = pad(now.getSeconds());
            $time_full.innerHTML = now;

            const tmpHourUTC = pad(utc_date.getUTCHours());
            if ($time_hours_utc.textContent !== tmpHourUTC) {
                $time_hours_utc.textContent = tmpHourUTC;
            }

            window.requestAnimationFrame(draw);
        }

        window.requestAnimationFrame(draw);
    })();
}

// Window size calculation and onload
window.onload = function(e)
{
    windowResized();
}

utils.addEvent(window, "resize", windowResized);

function windowResized() {
    utils.getElem("window-width").innerText = document.documentElement.clientWidth;
    utils.getElem("window-height").innerText = document.documentElement.clientHeight;
}