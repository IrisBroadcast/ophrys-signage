# Document shortcuts
[Breif introduction](#Breif-introduction)<br>
[Simple view](#Simple-view)<br>
[View/site](#View-site)<br>
[View/tab](#View-tab)<br>
[View/multi](#View-multi)<br>
[View/info](#View-info)<br>
[View/clock](#View-clock)<br>
[Combine different views](#Combine-different-views)<br>
[Advanced browser start-up parameters](#Advanced-browser-start-up-parameters)<br>

# Breif introduction <a name="Breif-introduction"></a><br>
To configure your Ophrys Signage you have three configuration sites to help you. The first one you will find at `yourhostname:82` and this site simply shows information about your Ophrys. From here you can get to `yourhostname:82/config`. Here you will find the main settings and choose your Ophrys appearance and what it will show. From the config-site you can get to `yourhostname:80/view`. This is where you find different view options that you can use together with what you configure on the main config-site.

# Views and how to use them

## Simple view <a name="Simple-view"></a><br>
Display a single webpage. No modifications or variables are available for this view.

### Example
- `http://mysite.com`

## View/site <a name="View-site"></a><br>
Shows one site embeded in an iframe. The variables bellow are available.

### Variables:
 - Url1 { "url without http" } (the site to show)
 - reload { "true" | "false" } (if the site should automatically be reloaded at a set interval)
 - delay { “15” } (number of seconds between each reload if reload=true)
 - bodypadding { "20px" } (add a boarder around the shown site)
 - bodybg { "white" | "black" | etc.} (choose color of the background that becomes visible if bodypadding is used)
 - clock { "true" | "false" } (show a clock at the bottom of the site)

 ### Example
 - `http://localhost:82/view/site?url1=example.com&reload=true&delay=10&bodypadding=20px&bodybg=white&clock=true`
 - `http://localhost:82/view/site?viewid=myview` Use this option to use the URL 1-field in View Options instead and replace `myview` with the ViewID configured in View Options. It can be used with variables in the same way as in the first example:
 - `http://localhost:82/view/site?viewid={viewid}&reload=true&delay=15&bodypadding=10px&bodybg=black&clock=false`

## View/tab <a name="View-tab"></a><br>
An (iframe) webpage slideshow that can switch between up to three sites. Be careful with adding site that takes a long time to load or with a lot of moving elements. This might not be suitable for all types of webpages since they don't like to be embedded by other sites.

### Variables:
- Url1 { "url without http" }
- Url2
- Url3
- Delay { “15” } (time for showing each page in seconds)
- Reload { "true" | "false" } (Should the site reload after being showed)

### Example
- `http://localhost:82/view/tab?url1=example.com&url2=mysite.com&delay=15&reload=false`
- `http://localhost:82/view/tab?viewid=myview&delay=15&reload=false` Use this option to use the URL 1-3-fields in View Options instead and replace `myview` with the ViewID configured in View Options. 

## View/multi <a name="View-multi"></a><br>
Loads 2 iframes side-by-side or on-top of each other.

### Variables:
- Url1 { "url without http" }
- Url2

### Example
- `http://localhost:82/view/multi?url1=example.com&url2=mysite.com`
- `http://localhost:82/view/multi?viewid=myview` Use this option to use the URL 1-2-fields in View Options instead and replace `myview` with the ViewID configured in View Options. 

## View/info <a name="View-info"></a><br>
Use /view/info to show your own custom html site. The information is instantly updated on save, and the view itself can be used with the different /view sites. To edit your custom html site, go to the view options and write it directly in the Custom HTML-field.

### Example
- `http://localhost:82/view/info` This in itself will not show anything before adding your own html in the views options. Try adding this html code to it:<br>

```html
<center>
<font size="7">
Hello world
</font>
<br>
<font size="6" color="#999999">
Ophrys Signage loves you
</font>
</center>
```
<br>

## View/clock <a name="View-clock"></a><br>
Displays a studio like clock. It shows the local "browser" clock, so make sure the operating system timezone is set. It could also be a good idea to set an NTP endpoint to one of your choice.

### Example
- `http://localhost:82/view/clock`

## Combine different views <a name="Combine-different-views"></a><br>
The views above can be combined. In the following example we will create a view/multi that shows a view/clock and a view/info:

### Example
- The "URL to display" will be `http://localhost:82/view/multi?viewid=myview`
- In the view configuration, write `/view/clock` in the URL 1-field and `/view/info` in the URL 2-field. Note that when presenting local views in these URL-fields you do not need to type http or localhost.
- In the Custom HTML-field, paste the html snippet found at [View/info](#View-info).
- Save and reload you webpage to see the result.

Main config:<br>
<img src="/static/readmeViewCombine_01.PNG" width="60%">

View options:<br>
<img src="/static/readmeViewCombine_02.PNG" width="60%">

## Advanced browser start-up parameters <a name="Advanced-browser-start-up-parameters"></a><br>
All views can be used with one or multiple Chromium start-up parameters.

### Example
- `--force-device-scale-factor=1.5` Use this to scale the site/sites content by 150% (same as ctrl +/- in most web browsers). Change "1.5" to find your desired content size where "1.0" is equal to 100% (normal) scale.
