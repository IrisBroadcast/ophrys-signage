# Usage examples

## Simple view
Display a single webpage

### Example
- `http://mysite.com`

## View/site
Shows only one site embeded in an iframe to add variables to modify how the site is being shown.

### Variables:
 - Url1 { "url without http" } (the site to show)
 - reload { "true" | "false" } (if the site should automatically be reloaded at a set interval)
 - delay { “15” } (number of seconds between each reload if reload=true)
 - bodypadding { "20px" } (add a boarder around the shown site)
 - bodybg { "white" | "black" | etc.} (choose color of the background that becomes visible if bodypadding is used)
 - clock { "true" | "false" } (show a clock at the bottom of the site)

 ### Example
 - `http://localhost:82/view/site?url1=example.com&reload=true&delay=10&bodypadding=20px&bodybg=white&clock=true`

## View/tab
An (iframe) webpage slideshow. Control sites and parameters by adding them to the url with "querystring". Be careful with adding site that takes a long time to load or with a lot of moving elements. This might not be suitable for all types of webpages since they don't like to be embedded by other sites.

### Variables:
- Url1 { "url without http" }
- Url2
- Url3
- Delay { “15” } (time for showing each page in seconds)
- Transition { "slide" | "fade" }
- Reload { "true" | "false" } (Should the site reload after being showed)

### Example
- `http://localhost:82/view/tab?url1=example.com&url2=mysite.com&delay=15&transition=ease&reload=false`

## View/multi
Loads 2 iframes side-by-side or on-top of each other.

### Variables:
- Url1 { "url without http" }
- Url2

### Example
- `http://localhost:82/view/multi?url1=example.com&url2=mysite.com`

## View/info
Use /view/info to show your own custom messages on the display.<br>
The information is instantly updated on save, and the view itself can be used with the different /view sites.<br><br>
Edit what is shown on this page by entering the ip-address-of-your-ophrys:82/view 

### Example - link to the page where the messages are edited
`192.168.10.5:82/view`

### Example - page to display to view the messages
- `http://localhost:82/view/info`

## View/clock
Displays a studio like clock. It shows the local "browser" clock, so make sure the operating system timezone is set. It could also be a good idea to set an NTP endpoint to one of your choice.

### Example
- `http://localhost:82/view/clock`

## Advanced browser start-up parameters
All views can be used with one or multiple Chromium start-up parameters.

### Example
- `--force-device-scale-factor=1.5` Use this to scale the site/sites content by 150% (same as ctrl +/- in most web browsers). Change "1.5" to find your desired content size where "1.0" is equal to 100% (normal) scale.
