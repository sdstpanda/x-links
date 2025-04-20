# x-links 8moe fork information

### Install with updates: <b>[x-links.user.js](https://raw.githubusercontent.com/sdstpanda/x-links/stable/builds/x-links.user.js)</b> *- the standard version of the userscript*<br />

Don't expect too much support I can't fix it for every single userscript. Just the main ones.  
You can send a pull request or make a new fork though.  

## Changelog  

- Basic 8moe support  
  - ***There might be some bugs or problems with other userscripts***  


---
---
---
---
---
---
---
---
---
---
---
---

# *original x-links readme below:*
---
---
---
---

# X-links

X-links is a heavily modified fork of [ExLinks](https://github.com/Hupotronic/ExLinks) with many improvements and added features.
It works on Firefox and Chrome to make your browsing experience on 4chan and friends more pleasurable.


## Installing

#### For full instructions and information, go to the [proper homepage](https://dnsev-h.github.io/x-links/).

To quickly install, here are the links to the different userscript versions:

* <b>[x-links.user.js](https://raw.githubusercontent.com/dnsev-h/x-links/stable/builds/x-links.user.js)</b> - the standard version of the userscript<br />
  You probably want this version
* <b>[x-links.debug.user.js](https://raw.githubusercontent.com/dnsev-h/x-links/stable/builds/x-links.debug.user.js)</b> - the debugging version of the userscript<br />
  If you install this version, keep in mind:
  * <i>It will be somewhat slower than the standard version</i>
  * <i>It <b>will not</b> overwrite the standard version</i>
  * <i>It <b>will not</b> automatically update (probably)</i>


## Developing

* Install [Node.js](https://nodejs.org/)
* Clone the repository
* Run `npm install` in the repository directory to install the required modules

#### build.js usage

```batch
node x-build [options] <meta files...>

Available options:
  --dev   Enable continous builds when relevant script files are updated
  --full  Build with full debugging information

If no meta files are specified, "./src/main.json" is used.
Otherwise, <meta files> is a list of .json files that act as build descriptors.
```

#### Post-build

You can also add a custom `post_build.bat` or `post_build.sh` file which is executed after a build is complete.
