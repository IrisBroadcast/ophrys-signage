# Special views, if you don't have anything better to display.

## View/clock
Displays a studio like clock. It shows the local "browser" clock, so make sure the operating system timezone is set. It could also be a good idea to set a NTP endpoint to one of your choice.

## View/tab
An iframe webpage slideshow. This is not suitable for all types of webpages since they don't like to be embedded by other sites. Control sites and parameters by adding them to the url with "querystring". Be careful with adding site that takes a long time to load or with a lot of moving elements.

### Variables:
- Url1 { "url without http" }
- Url2
- Url3
- Delay { “15” } (time for showing each page in seconds")
- Transition { "slide" | "fade" }
- Reload { "true" | "false" } (Should the site reload after being showed)

### Example
- View/tab?url1=example.com&url2=mysite.com&delay=15&transition=ease&reload=false

## View/multi
Loads 2 iframes side-by-side or on-top of each other.

### Variables:
- Url1 { "url without http" }
- Url2

### Example
- View/multi?url1=example.com&url2=mysite.com

