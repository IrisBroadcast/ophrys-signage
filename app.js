/*
 * Ophrys Signage
 *
 * Copyright (c) 2019 Roger Sandholm & Jim Eld, Stockholm, Sweden
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products
 *    derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const { spawn } = require("child_process");
const http_lib = require("http");

const fs = require("fs");
const os = require("os");
const express = require("express");

var signageConfigPath = "/usr/local/aloe/scripts/ophrys_state_node.json",
	signageStatePath = "/usr/local/aloe/scripts/ophrys_state_bash.json",
	signageViewDataPath = "/usr/local/aloe/scripts/ophrys_state_view.json",
	signageCustomVarDataPath = "/usr/local/aloe/scripts/ophrys_state_vars.json",
	signageConfigFile = {
		"title": "Ophrys Signage",
		"description": "",
		"url": "http://localhost:82",
		"browserparameter": "",
		"rotation": "normal",
		"fetchconfig": false,
		"remoteurl": false
	},
	signageStateFile = {
		"url": "http://localhost:82",
		"rotation": "normal",
		"browserparameter": "",
		"hardwaremodel": "",
		"hostname": ""
	},
	signageViewDataFile = {
		"view": "none",
		"html": "<div style=\"font-size: 4em\">\n <p>Opening hours:</p>\n <ul>\n  <li><span style=\"color: red;\">Sunday closed</span></li>\n  <li>Monday-Saturday 12:00-20:00</li>\n </ul>\n</div>",
		"script": "",
		"url1": "",
		"url2": "",
		"url3": ""
	},
	signageCustomVarDataFile = {
		"ref-56": "hej",
		"me": "ok"
	},
	signageUrlUpdateScript = "/usr/local/aloe/scripts/setdisplayconfig.sh",
	signageUrlRefreshScript = "/usr/local/aloe/scripts/setdisplayconfig.sh",
	signageScreenScript = "/usr/local/aloe/scripts/setdisplayconfig.sh",
	appState = {
		ip: [],
		sys: {}
	},
	applicationStartTime = Date.now(),
	applicationEnvironment = "Production";
	applicationWebPort = 82;

process.argv.forEach((val, index, array) =>
{
	var n = val.search(/--debug/gi)
	if (n===0)
	{
		console.log("# Entering DEBUG Mode");
		signageConfigPath = './ophrys_state_node.json';
		signageStatePath = './ophrys_state_bash.json';
		signageViewDataPath = './ophrys_state_view.json',
		signageCustomVarDataPath = './ophrys_state_vars.json',
		signageUrlUpdateScript = './debugscript.sh';
		signageUrlRefreshScript = './debugscript.sh';
		signageScreenScript = './debugscript.sh';
		applicationEnvironment = "Development";
	}

	var p = val.search(/--port/gi)
	if (p===0)
	{
		console.log("# Application Web Port: " + array[index+1]);
		applicationWebPort = Number(array[index+1]);
		signageConfigFile.url = "http://localhost:" + array[index+1];
		signageStateFile.url = "http://localhost:" + array[index+1];
	}
});

app.use(express.static("node_modules"));
app.use(express.static("static"));

// =============================================
// Utilities
var writeJsonToFile = (file, fileobj) =>
{
	try {
		fs.writeFile(file, JSON.stringify(fileobj), { flag: "w" }, (err) =>
		{
			if (err)
			{
				return console.log(err);
			}
			console.log("* Write JSON file", file)
		})
	}
	catch(err) {
		console.log("Error while writing file: " + file);
	}
}

var xReadFile = (file) =>
{
	return new Promise((resolve, reject) =>
	{
		fs.readFile(file, { encoding: "utf8", flag: "a+" }, (err, data) =>
		{
			if (err) return reject(err);
			console.log("* Read file", file)
			resolve(data)
		})
	})
}

var getRemoteConfig = (url) =>
{
	return new Promise((resolve, reject) =>
	{
		if (!signageConfigFile.hasOwnProperty("remoteurl"))
		{
			reject({ error: true, message: "No remote URL specified" });
		}

		var req = http_lib.get(signageConfigFile.remoteurl, (response) =>
		{
			var body = "";
			response.on("data", (d) =>
			{
				body += d;
			});
			response.on("end", () =>
			{
				try {
					var parsed = JSON.parse(body);
					var ret = {
						url: signageConfigFile.url,
						rotate: signageConfigFile.rotate
					}

					// Select remote config parameters
					if (parsed.hasOwnProperty("url") || parsed.hasOwnProperty("Url") || parsed.hasOwnProperty("URL"))
					{
						ret.url = parsed.url || parsed.Url || parsed.URL;
					}
					if (parsed.hasOwnProperty("rotation") || parsed.hasOwnProperty("Rotation") || parsed.hasOwnProperty("ROTATION"))
					{
						ret.rotation = parsed.rotation || parsed.Rotation || parsed.ROTATION;
					}

					// Verify if there is any new information here
					var gotNewUrl = true;
					var gotNewRotation = true;
					if (signageConfigFile.hasOwnProperty("url"))
					{
						if (ret.url == signageConfigFile.url)
						{
							gotNewUrl = false;
						}
					}

					if (signageConfigFile.hasOwnProperty("rotation"))
					{
						if (ret.rotation == signageConfigFile.rotation)
						{
							gotNewRotation = false;
						}
					}

					if (gotNewUrl || gotNewRotation)
					{
						resolve(ret);
					}
					else
					{
						reject({ error: false, message: "No changes in remote config" });
					}
				}
				catch (error)
				{
					reject({ error: true, message: "Could not parse remote url data" });
				}
			});
		});
		req.on("error", (error) =>
		{
			reject({ error: true, message: error });
		});
	});
}

var formatDateTime = (incoming, onlytime) =>
{
	onlytime = onlytime || false;
	var date = new Date(incoming);
	var dd = (date.getDate() < 10 ? "0" : "") + date.getDate();
	var MM = ((date.getMonth() + 1) < 10 ? "0" : "") + (date.getMonth() + 1);
	var yyyy = date.getFullYear();

	var hours = (date.getHours() < 10 ? "0" : "") + date.getHours();
	var minutes = (date.getMinutes() < 10 ? "0" : "") + date.getMinutes();
	var seconds = (date.getSeconds() < 10 ? "0" : "") + date.getSeconds();
	var milli = date.getMilliseconds();

	if (onlytime)
	{
		return (hours + ":" + minutes + ":" + seconds);
	}
	else
	{
		return (yyyy + "-" + MM + "-" + dd + " " + hours + ":" + minutes + ":" + seconds + ":" + milli);
	}
}

// =============================================
// System status
var checkIP = () =>
{
	// Get IP Address information
	var os = require("os");
	var ifaces = os.networkInterfaces();
	var ip = [];

	Object.keys(ifaces).forEach((ifname) =>
	{
		var alias = 0;

		ifaces[ifname].forEach((iface) =>
		{
			if ("IPv4" !== iface.family || iface.internal !== false)
			{
				// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
				return;
			}

			if (alias >= 1)
			{
				// this single interface has multiple ipv4 addresses aliases
				let tmp = ifname + ":" + alias + " " + iface.address;
				ip.push(tmp);
			}
			else if (ifaces[ifname].length == 1)
			{
				// this interface has only one ipv4 adress
				let tmp = iface.address;
				ip.push(tmp);
			}
			else
			{
				let tmp = iface.address + "";
				ip.push(tmp);
			}
			++alias;
		});
	});

	appState.ip = ip;
	io.emit("system-status", appState);
}

var getOsStats = () =>
{
	// Get CPU information
	var data = {};
	data.cpus = os.cpus();
	data.memoryfree = os.freemem();
	data.memorytotal = os.totalmem();
	data.arch = os.arch(); //x32, x64
	data.platform = os.platform();
	appState.sys = data;
	io.emit("system-status", appState);
}

// =============================================
// Initialize necessary things
var initListeners = () =>
{
	console.log("InitListeners");

	// Signage configuration state
	readConfigFile();

	fs.watch(signageConfigPath, { encoding: "buffer" }, (eventType, filename) =>
	{
		if (filename)
		{
			console.log("Change detected: " + eventType.toString() + " file: " + filename.toString());
			readConfigFile();
		}
	});

	// Signage bash state
	readStateFile();

	fs.watch(signageStatePath, { encoding: "buffer" }, (eventType, filename) =>
	{
		if (filename)
		{
			console.log("Change detected: " + eventType.toString() + " file: " + filename.toString());
			readStateFile();
		}
	});

	// Signage view data state
	readViewDataFile();

	fs.watch(signageViewDataPath, { encoding: "buffer" }, (eventType, filename) =>
	{
		if (filename)
		{
			console.log("Change detected: " + eventType.toString() + " file: " + filename.toString());
			readViewDataFile();
		}
	});

	// Signage custom variables state
	readCustomVariablesFile();

	fs.watch(signageCustomVarDataPath, { encoding: "buffer" }, (eventType, filename) =>
	{
		if (filename)
		{
			console.log("Change detected: " + eventType.toString() + " file: " + filename.toString());
			readCustomVariablesFile();
		}
	});
}

var initConfig = () =>
{
	console.log("Init: " + signageConfigPath);
	fs.access(signageConfigPath, fs.F_OK, (err) =>
	{
		if (err)
		{
			// File doesn't exist
			console.log("File doesn't exist:" + signageConfigPath);
			console.log(signageConfigFile);
			writeJsonToFile(signageConfigPath, signageConfigFile);
			initState();
		}
		else
		{
			// File exists
			console.log("File exist:" + signageConfigPath);
			initState();
		}
	});
}

var initState = () =>
{
	console.log("Init: " + signageStatePath);
	fs.access(signageStatePath, fs.F_OK, (err) =>
	{
		if (err)
		{
			// File doesn't exist
			console.log("File doesn't exist:" + signageStatePath);
			console.log(signageStateFile);
			writeJsonToFile(signageStatePath, signageStateFile);
			initViewData();
		}
		else
		{
			// File exists
			console.log("File exist:" + signageStatePath);
			initViewData();
		}
	});
}

var initViewData = function()
{
	console.log("Init: " + signageViewDataPath);
	fs.access(signageViewDataPath, fs.F_OK, (err) =>
	{
		if (err)
		{
			// File doesn't exist
			console.log("File doesn't exist:" + signageViewDataPath);
			console.log(signageViewDataFile);
			writeJsonToFile(signageViewDataPath, signageViewDataFile);
			initListeners();
		}
		else
		{
			// File exists
			console.log("File exist:" + signageViewDataPath);
			initListeners();
		}
	});
}

var readConfigFile = () =>
{
	xReadFile(signageConfigPath)
		.then((data) =>
		{
			parseConfigurationOptions(data);
		})
		.catch((err) =>
		{
			console.log(err);
		});
}

var readStateFile = () =>
{
	xReadFile(signageStatePath)
		.then((data) =>
		{
			parseStateOptions(data);
		})
		.catch((err) =>
		{
			console.log(err);
		});
}

var readViewDataFile = () =>
{
	xReadFile(signageViewDataPath)
		.then((data) =>
		{
			parseViewDataOptions(data);
		})
		.catch((err) =>
		{
			console.log(err);
		});
}

var readCustomVariablesFile = () =>
{
	xReadFile(signageCustomVarDataPath)
		.then((data) =>
		{
			parseCustomVariablesOptions(data);
		})
		.catch((err) =>
		{
			console.log(err);
		});
}

// =============================================
// Read local config and emit
var parseConfigurationOptions = (data) =>
{
	console.log("parseConfigurationOptions:");
	console.log(data);

	var configUpdate = {};
	var tmp = {
		"title": "",
		"description": "",
		"url": "http://localhost:" + applicationWebPort,
		"browserparameter": "",
		"rotation": "normal",
		"fetchconfig": false,
		"remoteurl": false
	};

	try {
		configUpdate = JSON.parse(data);
	} catch (err) {
		configUpdate = data;
	}

	// Get title (for use in health and on the webpage)
	if (configUpdate.hasOwnProperty("title")) {
		tmp.title = configUpdate.title;
	}

	// Get screen description (for use in health and on the webpage)
	if (configUpdate.hasOwnProperty("description")) {
		tmp.description = configUpdate.description;
	}

	// Screen configuration
	if (configUpdate.hasOwnProperty("rotation")) {
		tmp.rotation = configUpdate.rotation;
	}

	// Current URL to be fetched
	if (configUpdate.hasOwnProperty("url")) {
		tmp.url = configUpdate.url;
	}

	// Set up browser startup parameters
	if (configUpdate.hasOwnProperty("browserparameter")) {
		tmp.browserparameter = configUpdate.browserparameter;
	}

	// Should application check for an external config file?
	if (configUpdate.hasOwnProperty("fetchconfig")) {
		tmp.fetchconfig = configUpdate.fetchconfig;
	}

	if (tmp.fetchconfig) {
		doActionStartExternalConfigCheck();
	} else {
		doActionStopExternalConfigCheck();
	}

	// Get config from this url
	if (configUpdate.hasOwnProperty("remoteurl")) {
		tmp.remoteurl = configUpdate.remoteurl;
	}

	// Store the read in configuration
	signageConfigFile = tmp;

	// Emit to clients
	io.emit("config-options", signageConfigFile);
}

// Read local state and emit
var parseStateOptions = (data) =>
{
	console.log("parseStateOptions:");
	console.log(data);

	var configUpdate = {};
	var tmp = {
		"url": "http://localhost:" + applicationWebPort,
		"rotation": "normal",
		"browserparameter": "",
		"hardwaremodel": "",
		"hostname": ""
	};

	try {
		configUpdate = JSON.parse(data);
	} catch (err) {
		configUpdate = data;
	}

	// Current URL to be fetched
	if (configUpdate.hasOwnProperty("url")) {
		tmp.url = configUpdate.url;
	}

	// Screen configuration
	if (configUpdate.hasOwnProperty("rotation")) {
		tmp.rotation = configUpdate.rotation;
	}

	// Browser parameter configuration
	if (configUpdate.hasOwnProperty("browserparameter")) {
		tmp.browserparameter = configUpdate.browserparameter;
	}

	// Hardware model should not be written from form
	if (configUpdate.hasOwnProperty("hardwaremodel")) {
		tmp.hardwaremodel = configUpdate.hardwaremodel;
	}

	// Hostname
	if (configUpdate.hasOwnProperty("hostname")) {
		tmp.hostname = configUpdate.hostname;
	}

	// Store the read in configuration
	signageStateFile = tmp;

	// Emit to clients
	io.emit("config-options--state", signageStateFile);
}

// Read local view data and emit
var parseViewDataOptions = (data) =>
{
	console.log("parseViewDataOptions:");
	console.log(data);

	var configUpdate = {};
	var tmp = {
		"view": "none",
		"html": "",
		"script": "",
		"url1": "",
		"url2": "",
		"url3": ""
	};

	try {
		configUpdate = JSON.parse(data);
	} catch (err) {
		configUpdate = data;
	}

	// View
	if (configUpdate.hasOwnProperty("view")) {
		tmp.view = configUpdate.view;
	}

	// Html
	if (configUpdate.hasOwnProperty("html")) {
		tmp.html = configUpdate.html;
	}

	// Javascript
	if (configUpdate.hasOwnProperty("script")) {
		tmp.script = configUpdate.script;
	}

	// URL 1
	if (configUpdate.hasOwnProperty("url1")) {
		tmp.url1 = configUpdate.url1;
	}

	// URL 2
	if (configUpdate.hasOwnProperty("url2")) {
		tmp.url2 = configUpdate.url2;
	}

	// URL 3
	if (configUpdate.hasOwnProperty("url3")) {
		tmp.url3 = configUpdate.url3;
	}

	// Store the read in configuration
	signageViewDataFile = tmp;

	// Emit to clients
	io.emit("config-options--view-data", signageViewDataFile);
}

// Read local custom variables and emit
var parseCustomVariablesOptions = (data) =>
{
	console.log("parseCustomVariablesOptions:");
	console.log(data);

	var configUpdate = {};

	try {
		configUpdate = JSON.parse(data);
	} catch (err) {
		configUpdate = data;
	}

	// Store the read in configuration
	signageCustomVarDataFile = configUpdate;

	// Emit to clients
	io.emit("config-options--custom-variables", signageCustomVarDataFile);
}

// =============================================
// Config check timers
let configTimer = null;
let externalConfigCheck = {
	"timer": false,
	"remote-config": null,
	"loop-count": 0,
	"error": ""
};

var doActionStartExternalConfigCheck = async () =>
{
	if (configTimer == null)
	{
		console.log("doActionStartExternalConfigCheck is starting");
		let i = 1;
		configTimer = setTimeout(run = async () =>
		{
			let conf = '';
			let confFeedback = '';
			try
			{
				conf = await getRemoteConfig();
				doTranslateConfigFromForm(conf);
			}
			catch (err)
			{
				if (err.error)
				{
					console.error(err.message);
				}
				confFeedback = err.message;
			}

			// Tell client
			externalConfigCheck = {
				"timer": true,
				"remote-config": conf,
				"loop-count": i,
				"error": confFeedback
			};
			io.emit("config-external-timer", externalConfigCheck);

			i+=1;
			configTimer = setTimeout(run, 10000);
		},
		10000);
	}
	else
	{
		console.log("doActionStartExternalConfigCheck already started, restarting");
		doActionStopExternalConfigCheck();
		doActionStartExternalConfigCheck();
	}
}

var doActionStopExternalConfigCheck = async () =>
{
	if (configTimer)
	{
		console.log("doActionStopExternalConfigCheck");
		clearInterval(configTimer);
		configTimer = null;
	}
	externalConfigCheck = {
		"timer": false,
		"remote-config": null,
		"loop-count": 0,
		"error": ""
	};
	io.emit("config-external-timer", externalConfigCheck);
}

// =============================================
// Parse saving form
var doTranslateConfigFromForm = (configUpdate) =>
{
	// Store everything in App config
	var tmp = {};

	// Get title (for use in health and on the webpage)
	if (configUpdate.hasOwnProperty("title")) {
		tmp.title = configUpdate.title;
	} else if (signageConfigFile.hasOwnProperty("title")) {
		tmp.title = signageConfigFile.title;
	} else {
		tmp.title = "";
	}

	// Get screen description (for use in health and on the webpage)
	if (configUpdate.hasOwnProperty("description")) {
		tmp.description = configUpdate.description;
	} else if (signageConfigFile.hasOwnProperty("description")) {
		tmp.description = signageConfigFile.description;
	} else {
		tmp.description = "";
	}

	// Current URL to be fetched
	if (configUpdate.hasOwnProperty("url")) {
		tmp.url = configUpdate.url;
	} else if (signageStateFile.hasOwnProperty("url")) {
		tmp.url = signageStateFile.url;
	} else {
		tmp.url = "";
	}

	// Set up browser startup parameters
	if (configUpdate.hasOwnProperty("browserparameter")) {
		tmp.browserparameter = configUpdate.browserparameter;
	} else if (signageConfigFile.hasOwnProperty("browserparameter")) {
		tmp.browserparameter = signageConfigFile.browserparameter;
	} else {
		tmp.browserparameter = "";
	}

	// Screen configuration
	if (configUpdate.hasOwnProperty("rotation")) {
		tmp.rotation = configUpdate.rotation;
	} else if (signageStateFile.hasOwnProperty("rotation")) {
		tmp.rotation = signageStateFile.rotation;
	} else {
		tmp.rotation = "normal";
	}

	// Should application check for an external config file?
	if (configUpdate.hasOwnProperty("fetchconfig")) {
		tmp.fetchconfig = configUpdate.fetchconfig;
	} else if (signageConfigFile.hasOwnProperty("fetchconfig")) {
		tmp.fetchconfig = signageConfigFile.fetchconfig;
	} else {
		tmp.fetchconfig = false;
	}

	// Get config from this url
	if (configUpdate.hasOwnProperty("remoteurl")) {
		tmp.remoteurl = configUpdate.remoteurl;
	} else if (signageConfigFile.hasOwnProperty("remoteurl")) {
		tmp.remoteurl = signageConfigFile.remoteurl;
	} else {
		tmp.remoteurl = false;
	}

	console.log("Writing down config file content:");
	console.log(tmp);

	// Write down a JSON configuration file
	writeJsonToFile(signageConfigPath, tmp);

	// Do things
	if (tmp.fetchconfig) {
		doActionStartExternalConfigCheck();
	} else {
		doActionStopExternalConfigCheck();

		// Write down URL to be opened
		doActionUpdateUrl(tmp.url);
	}

	doActionRotateScreen(tmp.rotation);
	doActionBrowserParameters();
}

var doTranslateViewDataFromForm = (configUpdate) =>
{
	// Store everything in View Data config
	var tmp = {};

	// Get view selected
	if (configUpdate.hasOwnProperty("view")) {
		tmp.view = configUpdate.view;
	} else if (signageConfigFile.hasOwnProperty("view")) {
		tmp.view = signageConfigFile.view;
	} else {
		tmp.view = "";
	}

	// Get HTML data
	if (configUpdate.hasOwnProperty("html")) {
		tmp.html = configUpdate.html;
	} else if (signageConfigFile.hasOwnProperty("html")) {
		tmp.html = signageConfigFile.html;
	} else {
		tmp.html = "";
	}

	// Get Javascipt data
	if (configUpdate.hasOwnProperty("script")) {
		tmp.script = configUpdate.script;
	} else if (signageConfigFile.hasOwnProperty("script")) {
		tmp.script = signageConfigFile.script;
	} else {
		tmp.script = "";
	}

	// Get URL 1 data
	if (configUpdate.hasOwnProperty("url1")) {
		tmp.url1 = configUpdate.url1;
	} else if (signageConfigFile.hasOwnProperty("url1")) {
		tmp.url1 = signageConfigFile.url1;
	} else {
		tmp.url1 = "";
	}

	// Get URL 2 data
	if (configUpdate.hasOwnProperty("url2")) {
		tmp.url2 = configUpdate.url2;
	} else if (signageConfigFile.hasOwnProperty("url2")) {
		tmp.url2 = signageConfigFile.url2;
	} else {
		tmp.url2 = "";
	}

	// Get URL 3 data
	if (configUpdate.hasOwnProperty("url3")) {
		tmp.url3 = configUpdate.url3;
	} else if (signageConfigFile.hasOwnProperty("url3")) {
		tmp.url3 = signageConfigFile.url3;
	} else {
		tmp.url3 = "";
	}

	console.log("Writing down view data file content");

	// Write down a JSON view-data file
	writeJsonToFile(signageViewDataPath, tmp);
}

// =============================================
// Script action
var doActionUpdateUrl = async (url) =>
{
	// Run script for changing URL
	console.log("Trying to change URL " + url);
	if (url != signageStateFile.url)
	{
		var exitCode = await runBashScriptAsync(signageUrlUpdateScript, "url");
		console.log(exitCode);
	}
	else
	{
		console.log("URL is the same, no attempt to change it");
	}
	readStateFile();
}

var doActionRefreshUrl = async () =>
{
	// Run script for refreshing URL
	console.log("Trying to refresh URL " + signageConfigFile.url);
	var exitCode = await runBashScriptAsync(signageUrlRefreshScript, "refresh");
	console.log(exitCode);
	readStateFile();
}

var doActionBrowserParameters = async (browserparam) =>
{
	// Run script for changing browser parameters
	console.log("Trying to change browser parameters " + browserparam);
	if (browserparam != signageStateFile.browserparameter)
	{
		var exitCode = await runBashScriptAsync(signageUrlRefreshScript, "refresh");
		console.log(exitCode);
	}
	else
	{
		console.log("Browser parameters is the same, no attempt to change it");
	}
	readStateFile();
}

var doActionRotateScreen = async (rotate) =>
{
	// Run script for changing screen rotation
	console.log("Trying to rotate screen " + rotate);
	if (rotate != signageStateFile.rotation)
	{
		var exitCode = await runBashScriptAsync(signageScreenScript, ["rotate",rotate]);
		console.log(exitCode);
	}
	else
	{
		console.log("Rotation is the same, no attempt to change it");
	}
	readStateFile();
}

var doActionInitiateScript = async () =>
{
	// Run script for initiating values that script produce
	var exitCode = await runBashScriptAsync(signageScreenScript);
	console.log(exitCode);
}

var runBashScriptAsync = (scriptPath, scriptArg) =>
{
	scriptPath = ["/bin/bash", scriptPath];
	scriptArg = scriptArg || [];

	var args = scriptPath.concat(scriptArg)

	return new Promise((resolve, reject) =>
	{
		try
		{
			// child_process.spawn(command[, args][, options])
			const action = spawn("sudo", args);

			action.stdout.on("data", (data) =>
			{
				if (data.toString() !== "")
				{
					try
					{
						let tmp = data.toString().replace(/[\r\n]+$/, "");
						console.log(`stdout: ${tmp}`);
					}
					catch (err)
					{
						console.log(`stdout: ${data}`);
					}
				}
			});

			action.stderr.on("data", (data) =>
			{
				console.log(`stderr: ${data}`);
			});

			action.on("close", (code) =>
			{
				console.log(`script ended code: ${code}`);
				resolve(code);
			});
		}
		catch (err)
		{
			console.log("* Error running script " + scriptPath);
			reject(err);
		}
	});
}

// =============================================
// Initialize
doActionInitiateScript();
initConfig();

// =============================================
// Socket
io.on("connection", (Socket) =>
{
	console.log("> client connected");

	// Emit system info
	getOsStats();
	checkIP();

	// Emit configuration options & state
	io.emit("config-options", signageConfigFile);
	io.emit("config-options--state", signageStateFile);

	// Emit remote fetching config timer info
	io.emit("config-external-timer", externalConfigCheck);

	// Emit view data & custom variables configuration
	io.emit("config-options--view-data", signageViewDataFile);
	io.emit("config-options--custom-variables", signageCustomVarDataFile);

	// User saves config from website
	Socket.on("save config-options", (configUpdate) =>
	{
		doTranslateConfigFromForm(configUpdate);
	});

	// User saves view data
	Socket.on("save config-view-data", (configUpdate) =>
	{
		doTranslateViewDataFromForm(configUpdate);
	});

	// User refresh/reload browser
	Socket.on("user-action--reload-browser", () =>
	{
		doActionRefreshUrl();
	});

	Socket.on("disconnect", () =>
	{
		console.log("> User disconnected");
	});
});

// =============================================
// Web App Start and Routing
app.get("/", (req, res) =>
{
	res.sendFile(__dirname + "/app-initial.html");
});

app.get("/config", (req, res) =>
{
	res.sendFile(__dirname + "/app-config.html");
});

app.get("/view", (req, res) =>
{
	res.sendFile(__dirname + "/app-viewinfo.html");
});

app.get("/view/getconfig", (req, res) =>
{
	// Returns a view config if view is used with:
	// ?viewid=true
	let content = signageViewDataFile;
	res.writeHead(200, { "Content-Type": "application/json" });
	res.end(JSON.stringify(content), "utf-8");
});

app.get("/view/clock", (req, res) =>
{
	res.sendFile(__dirname + "/views/viewClock.html");
});

app.get("/view/info", (req, res) =>
{
	res.sendFile(__dirname + "/views/viewInfoScreen.html");
});

app.get("/view/tab", (req, res) =>
{
	res.sendFile(__dirname + "/views/viewTab.html");
});

app.get("/view/site", (req, res) =>
{
	res.sendFile(__dirname + "/views/viewSite.html");
});

app.get("/view/multi", (req, res) =>
{
	res.sendFile(__dirname + "/views/viewMulti.html");
});

app.get("/refresh", (req, res) =>
{
	doActionRefreshUrl();
	res.sendStatus(200);
});

app.get("/health", (req, res) =>
{
	let content =
	{
		ApplicationName : "Ophrys Signage",
		ServiceName : (signageConfigFile.title ? signageConfigFile.title : "Signage screen"),
		StartTime : formatDateTime(applicationStartTime),
		Server : (signageStateFile.hostname ? signageStateFile.hostname : "Not defined yet"),
		Environment : applicationEnvironment,
		Version : "1.0.0",
		LogLevel : "None",
		LogPath : "",
		Settings :
		{
			HardwareModel : (signageStateFile.hardwaremodel ? signageStateFile.hardwaremodel : "Unknown"),
			Hostname : (signageStateFile.hostname ? signageStateFile.hostname : "Unknown"),
			ScreenRotation : (signageConfigFile.rotation ? signageConfigFile.rotation : "Unknown"),
			Url : (signageConfigFile.url ? signageConfigFile.url : "Unknown"),
			BrowserParameter: (signageConfigFile.browserparameter ? signageConfigFile.browserparameter : "None"),
			RemoteUrl : (signageConfigFile.remoteurl ? signageConfigFile.remoteurl : "Unknown")
		},
		States :
		{
			FetchRemoteConfig : (signageConfigFile.fetchconfig ? signageConfigFile.fetchconfig : false),
			ScreenRotation : (signageStateFile.rotation ? signageStateFile.rotation : "Unknown"),
			Url : (signageStateFile.url ? signageStateFile.url : "Unknown")
		}
	};
	res.writeHead(200, { "Content-Type": "application/json" });
	res.end(JSON.stringify(content), "utf-8");
});

app.get("/test", (req, res) =>
{
	let content =
	{
		url: "http://example.com",
		rotation: "left"
	};
	res.writeHead(200, { "Content-Type": "application/json" });
	res.end(JSON.stringify(content), "utf-8");
});

http.listen(applicationWebPort, () =>
{
	console.log("Server listening on port: " + applicationWebPort);
});

http.on("error", (e) =>
{
	console.error("* Port " + applicationWebPort + " is occupied, start as sudo or change port");
	console.error(e);
});