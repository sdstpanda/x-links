<h1>X-links Extension API Documentation</h1>

<p>
X-links provides an API for developers to extend its normal capabilities.
As X-links takes care of a lot of compatibility quirks with different scripts, this makes it easy to add features without having to fork or copy code from it.
</p>
<p>
Extensions are installed as separate userscripts which can then communicate with the main X-links script by using the Extensions API JavaScript file provided.
</p>


<h2>Resources</h2>

<ul>
<li><a href="https://github.com/dnsev-h/x-links/blob/master/extensions/api.js">api.js</a> - the API file to include in an extension userscript</li>
<li><a href="https://github.com/dnsev-h/x-links/blob/master/src/extensions/nyaa.js">nyaa.js</a> - example extension</li>
<li><a href="https://github.com/dnsev-h/x-links/blob/master/src/extensions/nyaa.json">nyaa.json</a> - example extension build meta file</li>
<li><a href="https://github.com/dnsev-h/x-links/blob/master/build.js">build.js</a> - build file</li>
</ul>


<h2>API Function Documentation</h2>

<p>
The following members are available on the <code>xlinks_api</code> module:
</p>

<p>
<b><code>RequestErrorMode</code></b>: An enumeration of values to tell custom requests how to cache errors.<br />
<b><code>RequestErrorMode.None</code></b>: Don't save errors at all.<br />
<b><code>RequestErrorMode.NoCache</code></b>: Save errors for the current page. Will be cleared on refresh.<br />
<b><code>RequestErrorMode.Save</code></b>: Save errors for a time specified in the X-links script, usually one hour.
</p>

<p>
<b><code>ImageFlags</code></b>: An enumeration of flag values for usage with the <code>get_image</code> function.<br />
<b><code>ImageFlags.None</code></b>: Image URLs can be directly used.<br />
<b><code>ImageFlags.NoLeech</code></b>: Image URLs should be fetched without referrer information.
</p>

<p>
<b><code>config</code></b>: Configuration settings that are fetched and updated when registering. This includes custom settings.
</p>

<p>
<b><code>ttl_1_hour</code></b>: A convenience value for a 1-hour time-to-live. For usage with <code>cache_set</code>.<br />
<b><code>ttl_1_day</code></b>: A convenience value for a 1-day time-to-live. For usage with <code>cache_set</code>.<br />
<b><code>ttl_1_year</code></b>: A convenience value for a 1-year time-to-live. For usage with <code>cache_set</code>.
</p>

<p>
<b><code>is_object(value)</code></b>: A convenience function for <code>value !== null && typeof(value) === "object"</code><br />
<blockquote>
<b><code>any:value</code></b>: The value to check
</blockquote>
</p>

<p>
<b><code>random_string(len)</code></b>: Return a random string containing the characters <code>a-z, A-Z, 0-9</code><br />
<blockquote>
<b><code>any:len</code></b>: The length of the string to return
</blockquote>
</p>

<p>
<b><code>get_domain(url)</code></b>: Given a URL, this function returns the domain and any sub-domains as an array.<br />
<blockquote>
<b><code>string:url</code></b>: The URL to parse<br />
<i><b><code>return</code></b></i>: <code>[ string:sub_domain, string:domain ]</code><br />
Example: <code>"https://boards.4chan.org/"</code> would return <code>[ "boards.", "4chan.org" ]</code>
</blockquote>
</p>

<p>
<b><code>parse_json(text, default)</code></b>: Parses a JSON object without throwing exceptions<br />
<blockquote>
<b><code>string:text</code></b>: The text to parse into a JSON object<br />
<b><code>any:default</code></b>: The value to return in case something goes wrong
</blockquote>
</p>

<p>
<b><code>parse_html(text, default)</code></b>: Parses a HTML document without throwing exceptions<br />
<blockquote>
<b><code>string:text</code></b>: The text to parse into a HTML document<br />
<b><code>any:default</code></b>: The value to return in case something goes wrong
</blockquote>
</p>

<p>
<b><code>parse_xml(text, default)</code></b>: Parses an XML document without throwing exceptions<br />
<blockquote>
<b><code>string:text</code></b>: The text to parse into an XML document<br />
<b><code>any:default</code></b>: The value to return in case something goes wrong
</blockquote>
</p>

<p>
<b><code>insert_styles(style_text)</code></b>: Inserts a <code>&lt;style&gt;</code> element containing <code>style_text</code><br />
<blockquote>
<b><code>string:style_text</code></b>: The stylesheet source text
</blockquote>
</p>

<p>
<b><code>init(info, callback?)</code></b>: Initialize the extension.<br />
<blockquote>
<b><code>object:info</code></b>: The key to find the saved data under.<br />
<b><code>function:callback(err)</code></b><i><code>[optional]</code></i>: The function to run after the extension has been initiated.
</blockquote>
</p>

<p>
<b><code>cache_set(key, data, ttl)</code></b>: Save some data to the cache so it won't have to be re-requested later.<br />
<blockquote>
<b><code>string:key</code></b>: The key to save the data under.<br />
<b><code>any:data</code></b>: The data to save to the cache.<br />
<b><code>number:ttl</code></b>: The time to live of the data, in milliseconds.<br />
Note: this function will only work properly after <code>init</code>.
</blockquote>
</p>

<p>
<b><code>cache_get(key)</code></b>: Fetch some data from the cache.<br />
<blockquote>
<b><code>string:key</code></b>: The key to find the saved data under. See: <a href="#api-initialization">API Initialization</a><br />
<i><b><code>return</code></b></i>: Returns the cached object if found, or <code>null</code> if it wasn't found.<br />
Note: this function will only work properly after <code>init</code>.
</blockquote>
</p>

<p>
<b><code>register(descriptor, callback?)</code></b>: Register information and functions to be called by X-links.<br />
<blockquote>
<b><code>object:descriptor</code></b>: A descriptor indicating what should be registered. See: <a href="#api-registration">API Registration</a><br />
<b><code>function:callback(err)</code></b><i><code>[optional]</code></i>: The function to run after the extension has been initiated.<br />
Note: this function will only work properly after <code>init</code>.
</blockquote>
</p>

<p>
<b><code>request(namespace, type, unique_id, info, callback)</code></b>: Run a request function.<br />
<blockquote>
<b><code>string:namespace</code></b>: The request namespace.<br />
<b><code>string:type</code></b>: The request type to perform.<br />
<b><code>string:unique_id</code></b>: A unique identifier for the request.<br />
<b><code>any:info</code></b>: Custom data passed to the request functions.<br />
<b><code>function:callback(err, data)</code></b>: The function called on completion.<br />
Note: this function will only work properly after <code>init</code>.
</blockquote>
</p>

<p>
<b><code>get_image(url, flags, callback)</code></b>: Request a safe-to-use URL of an image.<br />
<blockquote>
<b><code>string:url</code></b>: The URL of the image to check.<br />
<b><code>number:flags</code></b>: Flags of the URL, from enumeration <code>ImageFlags</code><br />
<b><code>function:callback(err, url)</code></b>: The function called on completion.<br />
Note: this function will only work properly after <code>init</code>.
</blockquote>
</p>


<h2 id="api-initialization">API Initialization</h2>

<p>
The API must be initialized before its functions can work properly.
To do this, you must call the <code>xlinks_api.init</code> function with a descriptor.
</p>
<p>
The descriptor format is the following.
&lt;value&gt indicates a required value; [value] indicates an optional value.
<br />
<pre>{
    namespace: &lt;string&gt;,
    name: &lt;string&gt;,
    author: &lt;string&gt;,
    description: &lt;string&gt;,
    version: [array-of-number],
    registrations: [number],
    main: [function(xlinks_api)]
}</pre>
</p>
<p>
<blockquote>
<b><code>string:namespace</code></b>: The namespace of the extension, used to help X-links distinguish different extensions.<br />
<b><code>string:name</code></b>: The name of the extension.<br />
<b><code>string:author</code></b>: The extension's author.<br />
<b><code>string:description</code></b>: A description of the extension.<br />
<b><code>string:version</code></b>: An array indicating the version number.<br />
<b><code>string:registrations</code></b>: The number of times you plan on calling <code>xlinks_api.register</code>. If omitted, it assumes you will call it once.
</blockquote>
</p>
<p>
The <code>xlinks_api.init</code> function also takes a callback function that is executed when the extension is ready,
or an error has been encountered.
This is where calls to <code>xlinks_api.register</code> should be executed.
</p>


<h2 id="api-registration">API Registration</h2>

<p>
The registration function takes a descriptor and a callback function to be executed after registration.
</p>
<p>
The descriptor format is the following.
<br />
<pre>{
    settings: {
        &lt;settings_namespace&gt;: [
            [ &lt;name&gt;, &lt;default_value&gt;, &lt;label&gt;, &lt;description&gt;, &lt;descriptor?&gt; ],
            ...
        ],
        ...
    },
    request_apis: [
        {
            group: &lt;string&gt;,
            namespace: &lt;string&gt;,
            type: &lt;string&gt;,
            count: &lt;number&gt;,
            concurrent: &lt;number&gt;,
            delay_okay: &lt;number&gt;,
            delay_error: &lt;number&gt;,
            functions: {
                get_data: &lt;function(info,callback)&gt;,
                set_data: &lt;function(data,info,callback)&gt;,
                setup_xhr: &lt;function(callback)&gt;,
                parse_response: &lt;function(xhr,callback)&gt;
            }
        },
        ...
    ],
    linkifiers: [
        {
            regex: &lt;RegExp&gt;,
            prefix_group: &lt;number&gt;,
            prefix: &lt;string&gt;
        },
        ...
    ],
    commands: [
        {
            url_info: &lt;function(url,callback)&gt;,
            to_data: &lt;function(url_info,callback)&gt;,
            actions: &lt;function(data,info,callback)&gt;,
            details: &lt;function(data,info,callback)&gt;
        },
        ...
    ],
    create_url: {
        type: {
            to_gallery: &lt;string | array of string conditions&gt;,
            to_uploader: ...,
            to_category: ...,
            to_tag: ...,
            to_tag_ns: ...
        },
        ...
    }
}</pre>
</p>

