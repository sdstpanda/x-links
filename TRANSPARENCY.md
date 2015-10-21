# Information saved in your browser

H-links saves information related to its settings and cached gallery data.

* <b>Settings</b>
  All settings are saved using `GM_setValue`, `GM_getValue`, `GM_deleteValue`, and `GM_listValues`. This helps make the settings persist across http/https, and other websites.

* <b>Easy List Settings</b>
  Easy List settings are stored separately from regular settings, but they are stored in the same fashion.

* <b>Latest version</b>
  The last executed version of the userscript is also stored in saved settings. This is used to detect when an update occurs.

* <b>Cached gallery data</b>
  Gallery data is stored in either `window.localStorage` or `window.sessionStorage`, depending on a debug option in settings. This information contains the relevant gallery data and how long it's valid for.

* <b>Cached hash data</b>
  Image hash data related to reverse image search is also stored in the same way as gallery data.


# Information sent and received over the web

H-links fetches from various different websites using `GM_xmlhttpRequest`. This may mean that on Firefox, you may not be able to see these requests displayed in the Networking tab of the developer console. However, you can enable debug logging to see when each request is sent out, where it's going, and what it's sending.

* <b>[https://fonts.googleapis.com/css?family=Source+Sans+Pro:900](#)</b>
  This web font is requested when gallery details are displayed for the first time. This can be disabled in settings by unchecking `General` / `Allow external resources`.

* <b>[https://raw.githubusercontent.com/dnsev-h/h-links/master/changelog](#)</b>
  The changelog is fetched after an update, or if you click the "Changelog" button in the settings. This can be disabled in settings by unchecking `General` / `Show changelog on update`.

* <b>[https://raw.githubusercontent.com/dnsev-h/h-links/master/builds/h-links.meta.js](#)</b>
  This URL may be queried by your userscript manager to check if an update is available.

* <b>[https://raw.githubusercontent.com/dnsev-h/h-links/master/builds/h-links.user.js](#)</b>
  This URL may be used by your userscript manager to auto-update if an update is available.

* <b>Any image URLs on the board you're browsing</b>
  Images attached to posts are downloaded for hashing or re-upload for reverse image search when the  exsauce button is clicked.

* <b>Thumbnail URLs for gallery details</b>
  Thumbnails are requested from the external websites the gallery is located on. Thumbnails may be fetched using `GM_xmlhttpRequest` on sites that prevent leeching.

* <b>Reverse image lookup URLs</b>
  These are basically links to a search page on either g.e-hentai.org or exhentai.org. Note that your settings for that particular site will affect the results.

* <b>[http://g.e-hentai.org/api.php](#)</b>
  JSON requests are POST'd to this URL to get basic information about galleries.

* <b>[http://g.e-hentai.org/g/GID/TOKEN/](#)</b> or <b>[http://exhentai.org/g/GID/TOKEN/](#)</b>
  When an e*hentai gallery is hovered, additional information is fetched from this url, including tag namespaces. This can be disabled in settings by unchecking `Gallery Details` / `Extended info`.

* <b>[http://ul.e-hentai.org/image_lookup.php](#)</b> or <b>[http://ul.exhentai.org/image_lookup.php](#)</b>
  For similarity reverse image search, images attached to posts are uploaded to one of these URLs for lookup. This can take significantly longer than regular reverse image search if you have a slow upload speed.

* <b>[http://nhentai.net/g/GID/](#)</b>
  Gallery info for URLs from nhentai.net are fetched using URLs using this format. The information received is similar to that of e*hentai URLs.

* <b>[https://hitomi.la/galleries/GID.html](#)</b>
  Gallery info for URLs from hitomi.la are fetched using URLs using this format. The information received is similar to that of e*hentai URLs.
