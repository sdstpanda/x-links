/* jshint eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, undef:true, curly:false, browser:true, devel:true, newcap:false, maxerr:50 */
(function() {
  "use strict";

  var fetch, options, conf, tempconf, pageconf, regex, img, cat, d, t, $, $$,
    Debug, UI, Cache, API, Database, Hash, SHA1, Sauce, Filter, Parser, Options, Config, Theme, Main;

  img = {};
  cat = {
    "Artist CG Sets": {"short": "artistcg",  "name": "Artist CG"  },
    "Asian Porn":     {"short": "asianporn", "name": "Asian Porn" },
    "Cosplay":        {"short": "cosplay",   "name": "Cosplay"    },
    "Doujinshi":      {"short": "doujinshi", "name": "Doujinshi"  },
    "Game CG Sets":   {"short": "gamecg",    "name": "Game CG"    },
    "Image Sets":     {"short": "imageset",  "name": "Image Set"  },
    "Manga":          {"short": "manga",     "name": "Manga"      },
    "Misc":           {"short": "misc",      "name": "Misc"       },
    "Non-H":          {"short": "non-h",     "name": "Non-H"      },
    "Private":        {"short": "private",   "name": "Private"    },
    "Western":        {"short": "western",   "name": "Western"    }
  };
  fetch = {
    original: {value: "Original"},
    geHentai: {value: "g.e-hentai.org"},
    exHentai: {value: "exhentai.org"}
  };
  options = {
    general: {
      'Automatic Processing':        ['checkbox', true,  'Get data and format links automatically.'],
      'Gallery Details':             ['checkbox', true,  'Show gallery details for link on hover.'],
      'Gallery Actions':             ['checkbox', true,  'Generate gallery actions for links.'],
      'Smart Links':                 ['checkbox', false, 'All links lead to E-Hentai unless they have fjording tags.'],
      'ExSauce':                     ['checkbox', true,  'Add ExSauce reverse image search to posts. Disabled in Opera.'],
      'Extended Info':               ['checkbox', true,  'Fetch additional gallery info, such as tag namespaces']
    },
    actions: {
      'Show by Default':             ['checkbox', false, 'Show gallery actions by default.'],
      'Hide in Quotes':              ['checkbox', true,  'Hide any open gallery actions in inline quotes.'],
      'Torrent Popup':               ['checkbox', true,  'Use the default pop-up window for torrents.'],
      'Archiver Popup':              ['checkbox', true,  'Use the default pop-up window for archiver.'],
      'Favorite Popup':              ['checkbox', true,  'Use the default pop-up window for favorites.']
      // 'Favorite Autosave':         ['checkbox', false, 'Autosave to favorites. Overrides normal behavior.']
    },
    // favorite: {
      // 'Favorite Category':           ['favorite', 0, 'The category to use.'],
      // 'Favorite Comment':            ['textbox', 'ExLinks is awesome', 'The comment to use.']
    // },
    sauce: {
      'Inline Results':              ['checkbox', true,  'Shows the results inlined rather than opening the site. Works with Smart Links.'],
      'Show Results by Default':     ['checkbox', true,  'Open the inline results by default.'],
      'Hide Results in Quotes':      ['checkbox', true,  'Hide open inline results in inline quotes.'],
      'Show Short Results':          ['checkbox', true,  'Show gallery names when hovering over the link after lookup (similar to old ExSauce).'],
      'Search Expunged':             ['checkbox', false, 'Search expunged galleries as well.'],
      'Lowercase on 4chan':          ['checkbox', true,  'Lowercase ExSauce label on 4chan.'],
      'No Underline on Sauce':       ['checkbox', false,  'Force the ExSauce label to have no underline.'],
      'Use Custom Label':            ['checkbox', false, 'Use a custom label instead of the site name (e-hentai/exhentai).'],
      'Custom Label Text':           ['textbox', 'ExSauce', 'The custom label.'],
      'Site to Use':                 ['saucedomain', fetch.exHentai, 'The domain to use for the reverse image search.']
    },
    domains: {
      'Gallery Link':                ['domain', fetch.original, 'The domain used for the actual link. Overriden by Smart Links.'],
      'Torrent Link':                ['domain', fetch.original, 'The domain used for the torrent link in Actions.'],
      'Hentai@Home Link':            ['domain', fetch.original, 'The domain used for the Hentai@Home link in Actions.'],
      'Archiver Link':               ['domain', fetch.original, 'The domain used for the Archiver link in Actions.'],
      'Uploader Link':               ['domain', fetch.original, 'The domain used for the Uploader link in Actions.'],
      'Favorite Link':               ['domain', fetch.original, 'The domain used for the Favorite link in Actions.'],
      'Stats Link':                  ['domain', fetch.original, 'The domain used for the Stats link in Actions.'],
      'Tag Links':                   ['domain', fetch.original, 'The domain used for tag links in Actions.']
    },
    debug: {
      'Debug Mode':                  ['checkbox', false, 'Enable debugger and logging to browser console.'],
      'Disable Local Storage Cache': ['checkbox', false, 'If set, Session Storage is used for caching instead.'],
      'Populate Database on Load':   ['checkbox', false, 'Load all cached galleries to database on page load.']
    },
    filter: {
      'Full Highlighting':           ['checkbox', false, 'Highlight all the text instead of just the matching portion.'],
      'Good Tag Marker':             ['textbox', '!', 'The string to mark a good [Ex]/[EH] tag with.'],
      'Bad Tag Marker':              ['textbox', '', 'The string to mark a bad [Ex]/[EH] tag with.'],
      'Name Filter': ['textarea', [
        '# Highlight all doujinshi and manga galleries with (C82) in the name:',
        '# /\\(C82\\)/i;only:doujinshi,manga;link-color:red;color:#FF0000'
      ].join('\n'), ''],
      'Tag Filter': ['textarea', [
        '# Highlight "english" and "translated" tags in non-western non-non-h galleries:',
        '# /english|translated/;not:western,non-h;color:#4080f0;link-color:#4080f0;',
        '# Highlight galleries tagged with "touhou project":',
        '# /touhou project/;background:rgba(255,128,64,0.5);link-background:rgba(255,128,64,0.5);',
        '# Highlight all non-english language tags in doujinshi/manga/artistcg/gamecg galleries:',
        '# /korean|chinese|italian|vietnamese|thai|spanish|french|german|portuguese|russian|dutch|hungarian|indonesian|finnish|rewrite/;only:doujinshi,manga,artistcg,gamecg;underline:#FF0000;link-underline:#FF0000;'
      ].join('\n'), ''],
      'Uploader Filter': ['textarea', [
        '# Highlight links for galleries uploaded by "ExUploader"',
        '# /ExUploader/i;color:#FFFFFF;link-color:#FFFFFF;',
        '# Don\'t highlight anything uploaded by "CGrascal"',
        '# /CGrascal/i;bad:yes'
      ].join('\n'), '']
    }
  };
  regex = {
    url: /(https?:\/\/)?(forums|gu|g|u)?\.?e[\-x]hentai\.org\/[^\ \n<>\'\"]*/,
    protocol: /https?\:\/\//,
    site: /(g\.e\-hentai\.org|exhentai\.org)/,
    type: /t?y?p?e?[\/|\-]([gs])[\/|\ ]/,
    uid: /uid\-([0-9]+)/,
    token: /token\-([0-9a-f]+)/,
    page: /page\-([0-9a-f]+)\-([0-9]+)/,
    gid: /\/g\/([0-9]+)\/([0-9a-f]+)/,
    sid: /\/s\/([0-9a-f]+)\/([0-9]+)\-([0-9]+)/,
    fjord: /abortion|bestiality|incest|lolicon|shotacon|toddlercon/
  };
  t = {
    SECOND: 1000,
    MINUTE: 1000 * 60,
    HOUR: 1000 * 60 * 60,
    DAY: 1000 * 60 * 60 * 24
  };
  d = document;
  conf = {};
  tempconf = {};
  pageconf = {};

  // Inspired by 4chan X and jQuery API: https://api.jquery.com/ (functions are not chainable)
  $ = function (selector, root) {
    return (root || d.body).querySelector(selector);
  };
  $$ = function (selector, root) {
    return Array.prototype.slice.call((root || d.body).querySelectorAll(selector));
  };
  $.extend = function (obj, properties) {
    for (var k in properties) {
      if (Object.prototype.hasOwnProperty.call(properties, k)) {
        obj[k] = properties[k];
      }
    }
  };
  $.extend($, {
    clamp: function (value, min, max) {
      return Math.min(max, Math.max(min, value));
    },
    elem: function (arr) {
      var frag = d.createDocumentFragment();
      for (var i = 0, ii = arr.length; i < ii; ++i) {
        frag.appendChild(arr[i]);
      }
      return frag;
    },
    frag: function (content) {
      var frag, div, i, ii;
      frag = d.createDocumentFragment();
      div = $.create('div', {
        innerHTML: content
      });
      for (i = 0, ii = div.childNodes.length; i < ii; ++i) {
        frag.appendChild(div.childNodes[i].cloneNode(true));
      }
      return frag;
    },
    textnodes: function (elem) {
      var tn = [],
        ws = /^\s*$/,
        getTextNodes;

      getTextNodes = function (node) {
        var cn, i, ii;
        for (i = 0, ii = node.childNodes.length; i < ii; ++i) {
          cn = node.childNodes[i];
          if (cn.nodeType === 3) { // TEXT_NODE
            if (!ws.test(cn.nodeValue)) {
              tn.push(cn);
            }
          }
          else if (cn.nodeType === 1) { // ELEMENT_NODE
            if (cn.tagName === 'SPAN' || cn.tagName === 'P' || cn.tagName === 'S') {
              getTextNodes(cn);
            }
          }
        }
      };

      getTextNodes(elem);
      return tn;
    },
    id: function (id) {
      return d.getElementById(id);
    },
    prepend: function (parent, child) {
      return parent.insertBefore(child, parent.firstChild);
    },
    add: function (parent, child) {
      return parent.appendChild(child);
    },
    before: function (root, elem) {
      return root.parentNode.insertBefore(elem, root);
    },
    after: function (root, elem) {
      return root.parentNode.insertBefore(elem, root.nextSibling);
    },
    replace: function (root, elem) {
      return root.parentNode.replaceChild(elem, root);
    },
    remove: function (elem) {
      return elem.parentNode.removeChild(elem);
    },
    tnode: function (text) {
      return d.createTextNode(text);
    },
    create: function (tag, properties) {
      var elem = d.createElement(tag);
      if (properties) {
        $.extend(elem, properties);
      }
      return elem;
    },
    on: function (elem, eventlist, handler) {
      var event, i, ii;
      if (eventlist instanceof Array) {
        for (i = 0, ii = eventlist.length; i < ii; ++i) {
          event = eventlist[i];
          elem.addEventListener(event[0], event[1], false);
        }
      }
      else {
        elem.addEventListener(eventlist, handler, false);
      }
    },
    off: function (elem, eventlist, handler) {
      var event, i, ii;
      if (eventlist instanceof Array) {
        for (i = 0, ii = eventlist.length; i < ii; ++i) {
          event = eventlist[i];
          elem.removeEventListener(event[0], event[1], false);
        }
      }
      else {
        elem.removeEventListener(eventlist, handler, false);
      }
    }
  });
  Debug = {
    on: false,
    timer: {},
    value: {},
    init: function () {
      if (conf['Debug Mode'] === true) {
        Debug.on = true;
      }
      $.extend(Debug.timer, {
        start: function (name) {
          if (Debug.on) {
            Debug.timer[name] = Date.now();
          }
        },
        stop: function (name) {
          if (Debug.on) {
            Debug.timer[name] = Date.now() - Debug.timer[name];
            return Debug.timer[name] + 'ms';
          }
        }
      });
      $.extend(Debug.value, {
        add: function (name, value) {
          if (Debug.on) {
            if (!Debug.value[name]) {
              Debug.value[name] = 0;
            }
            if (value) {
              Debug.value[name] += value;
            }
            else {
              ++Debug.value[name];
            }
          }
        },
        get: function (name) {
          if (Debug.on) {
            var ret = Debug.value[name];
            Debug.value[name] = 0;
            return ret || 0;
          }
        },
        set: function (name, value) {
          if (Debug.on) {
            Debug.value[name] = value;
          }
        }
      });
    },
    log: function (arr) {
      if (Debug.on) {
        var log = (arr instanceof Array) ? arr : [arr],
          i, ii;
        for (i = 0, ii = log.length; i < ii; ++i) {
          console.log('ExLinks ' + Main.version + ':', log[i]);
        }
      }
    }
  };
  UI = {
    html: {
      details: function (data) { return '#DETAILS#'; },
      actions: function (data) { return '#ACTIONS#'; },
      options: function ()     { return '#OPTIONS#'; },
      stars: function (data) {
        var str = '',
          star = '',
          rating = Math.round(parseFloat(data, 10) * 2),
          tmp, i;

        for (i = 0; i < 5; ++i) {
          tmp = $.clamp(rating - (i * 2), 0, 2);
          switch (tmp) {
            case 0: star = 'none'; break;
            case 1: star = 'half'; break;
            case 2: star = 'full'; break;
          }
          str += '<div class="exr' + (i + 1) + ' star-' + star + '"></div>';
        }
        return str;
      }
    },
    createtags: function (site, tags, data) {
      var tagfrag = d.createDocumentFragment(),
        tag, link, i, ii;
      for (i = 0, ii = tags.length; i < ii; ++i) {
        tag = $.create('span', {
          className: "extag-block"
        });
        link = $.create('a', {
          textContent: tags[i],
          className: "exlink extag",
          href: 'http://' + site + '/tag/' + tags[i].replace(/\ /g, '+')
        });

        Filter.highlight("tags", link, data, null);

        tag.appendChild(link);
        if (i < ii - 1) tag.appendChild($.tnode(","));
        tagfrag.appendChild(tag);
      }
      return tagfrag;
    },
    details: function (uid) {
      var data = Database.get(uid),
        date, div, frag, tagspace, content, n;

      if (data.title_jpn) {
        data.jtitle = '<br /><span class="exjptitle">' + data.title_jpn + '</span>';
      }
      else {
        data.jtitle = '';
      }
      date = new Date(parseInt(data.posted, 10) * 1000);
      data.datetext = UI.date(date);
      data.visible = data.expunged ? 'No' : 'Yes';

      div = $.frag(UI.html.details(data));

      if ((n = $('.extitle', div)) !== null) {
        Filter.highlight("title", n, data, null);
      }
      if ((n = $('.exuploader', div)) !== null) {
        Filter.highlight("uploader", n, data, null);
      }

      content = div.firstChild;
      tagspace = $('.extags', div);
      content.style.setProperty("display", "table", "important");
      $.add(tagspace, UI.createtags("exhentai.org", data.tags, data));
      frag = d.createDocumentFragment();
      frag.appendChild(div);
      d.body.appendChild(frag);

      // Full info
      if (conf['Extended Info']) {
        if (data.full && data.full.version >= API.full_version) {
          UI.display_full(data);
        }
        else {
          Debug.log("Requesting full info for " + data.gid + "/" + data.token);
          API.request_full_info(data.gid, data.token, function (err, full_data) {
            if (err === null) {
              data.full = full_data;
              Database.set(data);
              UI.display_full(data);
            }
            else {
              Debug.log("Error requesting full information: " + err);
            }
          });
        }
      }
    },
    actions: function (data, link) {
      var uid, token, key, date, user, sites, tagstring, button, div, tagspace, frag, content, n;

      tagstring = data.tags.join(',');

      if (conf['Smart Links'] === true) {
        if (tagstring.match(regex.fjord)) {
          if (link.href.match('g.e-hentai.org')) {
            link.href = link.href.replace('g.e-hentai.org', 'exhentai.org');
            button = $.id(link.id.replace('gallery', 'button'));
            button.href = link.href;
            button.innerHTML = UI.button.text(link.href);
          }
        }
        else {
          if (link.href.match('exhentai.org')) {
            link.href = link.href.replace('exhentai.org', 'g.e-hentai.org');
            button = $.id(link.id.replace('gallery', 'button'));
            button.href = link.href;
            button.innerHTML = UI.button.text(link.href);
          }
        }
      }
      uid = data.gid;
      token = data.token;
      key = data.archiver_key;
      date = new Date(parseInt(data.posted, 10) * 1000);
      data.size = Math.round((data.filesize / 1024 / 1024) * 100) / 100;
      data.datetext = UI.date(date);
      sites = [
        Config.link(link.href, conf['Torrent Link']),
        Config.link(link.href, conf['Hentai@Home Link']),
        Config.link(link.href, conf['Archiver Link']),
        Config.link(link.href, conf['Favorite Link']),
        Config.link(link.href, conf['Uploader Link']),
        Config.link(link.href, conf['Stats Link']),
        Config.link(link.href, conf['Tag Links'])
      ];
      user = data.uploader || 'Unknown';
      data.url = {
        ge: "http://g.e-hentai.org/g/" + uid + "/" + token + "/",
        ex: "http://exhentai.org/g/" + uid + "/" + token + "/",
        bt: "http://" + sites[0] + "/gallerytorrents.php?gid=" + uid + "&t=" + token,
        hh: "http://" + sites[1] + "/hathdler.php?gid=" + uid + "&t=" + token,
        arc: "http://" + sites[2] + "/archiver.php?gid=" + uid + "&token=" + token + "&or=" + key,
        fav: "http://" + sites[3] + "/gallerypopups.php?gid=" + uid + "&t=" + token + "&act=addfav",
        user: "http://" + sites[4] + "/uploader/" + user.replace(/\ /g, '+'),
        stats: "http://" + sites[5] + "/stats.php?gid=" + uid + "&t=" + token
      };
      if (data.url.arc.match("g.e-hentai.org") && tagstring.match(regex.fjord)) {
        data.url.arc = data.url.arc.replace('g.e-hentai', 'exhentai');
      }
      frag = d.createDocumentFragment();
      div = $.frag(UI.html.actions(data));

      if ((n = $('.exuploader', div)) !== null) {
        Filter.highlight("uploader", n, data, null);
      }

      content = div.firstChild;
      content.id = link.id.replace('exlink-gallery', 'exblock-actions');
      content.style.setProperty("display", conf['Show by Default'] ? "table" : "none", "important");
      tagspace = $('.extags', div);
      $.add(tagspace, UI.createtags(sites[6], data.tags, data));
      frag.appendChild(div);
      return frag;
    },
    button: function (url, eid) {
      var button;
      button = $.create('a', {
        id: eid.replace('gallery', 'button'),
        className: 'exlink exbutton exfetch',
        innerHTML: UI.button.text(url),
        href: url
      });
      button.style.marginRight = '4px';
      button.style.textDecoration = 'none';
      button.setAttribute('target', '_blank');
      return button;
    },
    toggle: function (e) {
      var actions = $.id(this.id.replace('exlink-button', 'exblock-actions'));
      actions.style.display = (actions.style.display === "none") ? "table" : "none";
      e.preventDefault();
    },
    show: function () {
      var uid = this.className.match(regex.uid)[1],
        details = $.id('exblock-details-uid-' + uid);

      if (details) {
        details.style.display = "table";
      }
      else {
        UI.details(uid);
      }
    },
    hide: function () {
      var uid = this.className.match(regex.uid)[1],
        details = $.id('exblock-details-uid-' + uid);

      if (details) {
        details.style.display = "none";
      }
      else {
        UI.details(uid);
      }
    },
    move: function (e) {
      var uid = this.className.match(regex.uid)[1],
        details = $.id('exblock-details-uid-' + uid);
      if (details) {
        if (details.offsetWidth + e.clientX + 20 < window.innerWidth - 8) {
          details.style.left = (e.clientX + 12) + 'px';
        }
        else {
          details.style.left = (window.innerWidth - details.offsetWidth - 16) + 'px';
        }
        if (details.offsetHeight + e.clientY + 22 > window.innerHeight) {
          details.style.top = (e.clientY - details.offsetHeight - 8) + 'px';
        }
        else {
          details.style.top = (e.clientY + 22) + 'px';
        }
      }
    },
    popup: function (e) {
      e.preventDefault();
      var w = 400,
        h = 400,
        link = e.target,
        type = link.href.match(/gallerytorrents|gallerypopups|archiver/)[0];

      if (type === "gallerytorrents") {
        w = 610;
        h = 590;
      }
      else if (type === "gallerypopups") {
        w = 675;
        h = 415;
      }
      else if (type === "archiver") {
        w = 350;
        h = 320;
      }
      if (type) {
        window.open(
          link.href,
          "_pu" + (Math.random() + "").replace(/0\./, ""),
          "toolbar=0,scrollbars=0,location=0,statusbar=0,menubar=0,resizable=0,width=" + w + ",height=" + h + ",left=" + ((screen.width - w) / 2) + ",top=" + ((screen.height - h) / 2)
        );
      }
    },
    date: function (d) {
      var pad = function (n, sep) {
        return (n < 10 ? '0' : '') + n + sep;
      };
      return d.getUTCFullYear() + '-' +
        pad(d.getUTCMonth() + 1, '-') +
        pad(d.getUTCDate(), ' ') +
        pad(d.getUTCHours(), ':') +
        pad(d.getUTCMinutes(), '');
    },
    init: function () {
      $.extend(UI.button, {
        text: function (url) {
          if (url.match('exhentai.org')) {
            return '[Ex]';
          }
          else if (url.match('g.e-hentai.org')) {
            return '[EH]';
          }
          else {
            return false;
          }
        }
      });
    },
    display_full: function (data) {
      var nodes = document.querySelectorAll(".extags.uid-" + data.gid),
        tagfrag = d.createDocumentFragment(),
        re_site = /exhentai\.org/i,
        namespace, namespace_style, tags, tag, link, site, i, j, n, t, ii;

      if (nodes.length === 0 || Object.keys(data.full.tags).length === 0) {
        return;
      }

      for (namespace in data.full.tags) {
        tags = data.full.tags[namespace];
        namespace_style = " extag-namespace extag-namespace-" + namespace.replace(/\ /g, '-');

        tag = $.create('span', {
          className: "extag-block extag-block-namespace" + Theme.get() + namespace_style
        });
        link = $.create('span', {
          textContent: namespace,
          className: "extag-block-namespace-tag"
        });
        tag.appendChild(link);
        tag.appendChild($.tnode(":"));
        tagfrag.appendChild(tag);

        for (i = 0, ii = tags.length; i < ii; ++i) {
          tag = $.create('span', { className: "extag-block" + namespace_style });
          link = $.create('a', {
            textContent: tags[i],
            className: "exlink extag",
            href: 'http://exhentai.org/tag/' + tags[i].replace(/\ /g, '+')
          });

          Filter.highlight("tags", link, data, null);

          tag.appendChild(link);
          tag.appendChild($.tnode(i === ii - 1 ? ";" : ","));
          tagfrag.appendChild(tag);
        }
      }
      tagfrag.lastChild.removeChild(tagfrag.lastChild.lastChild);

      for (i = 0; i < nodes.length; ) {
        n = nodes[i];
        t = tagfrag;
        ++i;

        if (
          (link = n.querySelector("a[href]")) !== null &&
          !re_site.test(link.getAttribute("href"))
        ) {
          site = Config.link(link.href, conf['Stats Link']);
          t = (i < nodes.length) ? tagfrag.cloneNode(true) : tagfrag;
          tags = t.querySelectorAll("a[href]");
          for (j = 0; j < tags.length; ++j) {
            tags[j].setAttribute("href", tags[j].getAttribute("href").replace(re_site, site));
          }
        }
        else if (i < nodes.length) {
          t = tagfrag.cloneNode(true);
        }

        n.innerHTML = "";
        n.appendChild(t);
      }
    }
  };
  API = {
    s: {},
    so: {},
    g: {},
    go: {},
    cooldown: 0,
    working: false,
    full_timer: null,
    full_queue: [],
    full_version: 1,
    queue: function (type) {
      if (type === 's') {
        for (var k in API.g) {
          if (API.s[k]) {
            delete API.s[k];
          }
        }
        return Object.keys(API.s).length;
      }
      else if (type === 'g') {
        return Object.keys(API.g).length;
      }
      return 0;
    },
    request: function (type) {
      var limit = 0,
        request = null,
        j, k;

      if (type === 's') {
        request = {
          "method": "gtoken",
          "pagelist": []
        };
        for (j in API.s) {
          if (limit < 25) {
            request.pagelist.push([
              parseInt(j, 10),
              API.s[j][0],
              parseInt(API.s[j][1], 10)
            ]);
            ++limit;
          }
          else {
            API.queue.add('so', j, API.s[j][0], API.s[j][1]);
          }
        }
      }
      else if (type === 'g') {
        request = {
          "method": "gdata",
          "gidlist": []
        };
        for (k in API.g) {
          if (limit < 25) {
            request.gidlist.push([
              parseInt(k, 10),
              API.g[k]
            ]);
            ++limit;
          }
          else {
            API.queue.add('go', k, API.g[k]);
          }
        }
      }
      if (request !== null) {
        if (!API.working && Date.now() > API.cooldown) {
          API.working = true;
          API.cooldown = Date.now();
          Debug.timer.start('apirequest');
          Debug.log([ 'API Request', request ]);
          GM_xmlhttpRequest({
            method: 'POST',
            url: 'http://g.e-hentai.org/api.php',
            data: JSON.stringify(request),
            headers: {
              'Content-Type': 'application/json'
            },
            onload: function (xhr) {
              var json = null;
              if (xhr.readyState === 4 && xhr.status === 200) {
                try {
                  json = JSON.parse(xhr.responseText) || {};
                }
                catch (e) {
                  json = {};
                }
                if (Object.keys(json).length > 0) {
                  Debug.log([ 'API Response, Time: ' + Debug.timer.stop('apirequest'), json ]);
                  API.response(type, json);
                }
                else {
                  Debug.log('API Request error. Waiting five seconds before trying again. (Time: ' + Debug.timer.stop('apirequest') + ')');
                  Debug.log(xhr.responseText);
                  // API.cooldown = Date.now() + (5 * t.SECOND);
                  setTimeout(Main.update, 5000);
                }
              }
            }
          });
        }
      }
    },
    response: function (type, json) {
      var arr, i, ii;
      if (type === 's') {
        arr = json.tokenlist;
        for (i = 0, ii = arr.length; i < ii; ++i) {
          API.queue.add('g', arr[i].gid, arr[i].token);
        }
        API.queue.clear('s');
        if (Object.keys(API.so).length > 0) {
          API.s = API.so;
          API.queue.clear('so');
        }
        API.working = false;
      }
      else if (type === 'g') {
        arr = json.gmetadata;
        for (i = 0, ii = arr.length; i < ii; ++i) {
          Database.set(arr[i]);
          Main.queue.add(arr[i].gid);
        }
        API.queue.clear('g');
        if (Object.keys(API.go).length > 0) {
          API.g = API.go;
          API.queue.clear('go');
        }
        API.working = false;
      }
      Main.update();
    },
    init: function () {
      $.extend(API.queue, {
        add: function (type, uid, token, page) {
          if (type === 's') {
            API.s[uid] = [ token, page ];
          }
          else if (type === 'so') {
            API.so[uid] = [ token, page ];
          }
          else if (type === 'g') {
            API.g[uid] = token;
          }
          else if (type === 'go') {
            API.go[uid] = token;
          }
        },
        clear: function (type) {
          API[type] = {};
        }
      });
    },
    request_full_info: function (id, token, cb) {
      if (API.full_timer === null) {
        API.execute_full_request(id, token, cb);
      }
      else {
        API.full_queue.push([ id, token, cb ]);
      }
    },
    on_request_full_next: function () {
      API.full_timer = null;
      if (API.full_queue.length > 0) {
        var d = API.full_queue.shift();
        API.execute_full_request(d[0], d[1], d[2]);
      }
    },
    execute_full_request: function (id, token, cb) {
      var callback = function (err, data) {
        API.full_timer = setTimeout(API.on_request_full_next, 200);
        cb(err, data);
      };

      GM_xmlhttpRequest({
        method: 'GET',
        url: 'http://exhentai.org/g/' + id + '/' + token + '/',
        onload: function (xhr) {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              var html = null;
              try {
                html = (new DOMParser()).parseFromString(xhr.responseText, "text/html");
              }
              catch (e) {}

              if (html === null) {
                callback("Error parsing html", null);
              }
              else {
                html = API.parse_full_info(html);
                if (html === null) {
                  callback("Error parsing info", null);
                }
                else {
                  callback(null, html);
                }
              }
            }
            else {
              callback("Bad status " + xhr.status, null);
            }
          }
        },
        onerror: function () {
          callback("Connection error", null);
        },
        onabort: function () {
          callback("Connection aborted", null);
        }
      });
    },
    parse_full_info: function (html) {
      var data = {
        version: API.full_version,
        tags: {}
      };

      // Tags
      var pattern = /(.+):/,
        par = html.querySelectorAll("#taglist tr"),
        tds, namespace, ns, i, j, m, n;

      for (i = 0; i < par.length; ++i) {
        // Class
        tds = par[i].querySelectorAll("td");
        if (tds.length > 0) {
          // Namespace
          namespace = ((m = pattern.exec(tds[0].textContent)) ? m[1].trim() : "");
          if (!(namespace in data.tags)) {
            ns = [];
            data.tags[namespace] = ns;
          }
          else {
            ns = data.tags[namespace];
          }

          // Tags
          tds = tds[tds.length - 1].querySelectorAll("div");
          for (j = 0; j < tds.length; ++j) {
            // Create tag
            if ((n = tds[j].querySelector("a")) !== null) {
              // Add tag
              data.tags[namespace].push(n.textContent.trim());
            }
          }
        }
      }

      return data;
    }
  };
  Cache = {
    type: null,
    init: function () {
      var res = [],
        key, json, i, ii;

      Cache.type = conf['Disable Local Storage Cache'] ? sessionStorage : localStorage;

      for (i = 0, ii = Cache.type.length; i < ii; ++i) {
        key = Cache.type.key(i);
        if (key.match(/exlinks-(gallery|md5|sha1)/)) {
          json = Cache.type.getItem(key);
          json = JSON.parse(json);
          if (Date.now() > json.added + json.TTL) {
            res.push(key);
          }
        }
      }
      ii = res.length;
      if (ii > 0) {
        Debug.log("Purged " + ii + " old entries from cache.");
        for (i = 0; i < ii; ++i) {
          Cache.type.removeItem(res[i]);
        }
      }
    },
    get: function (uid, type) {
      var key, json;
      if (!type) type = 'gallery';
      key = Main.namespace + type + '-' + uid;
      json = Cache.type.getItem(key);
      if (json) {
        json = JSON.parse(json);
        if (Date.now() > json.added + json.TTL) {
          Cache.type.removeItem(key);
          return false;
        }
        else {
          return json.data;
        }
      }
      return false;
    },
    set: function (data, type, hash, ttl) {
      var key, keyid, TTL, limit, date, value;
      if (!type) {
        type = 'gallery';
        keyid = data.gid;
        limit = Date.now() - (12 * t.HOUR);
        date = new Date(parseInt(data.posted, 10) * 1000);
        if (date > limit) {
          TTL = date - limit;
        }
        else {
          TTL = 12 * t.HOUR;
        }
      }
      else {
        keyid = hash;
        TTL = ttl;
      }
      key = Main.namespace + type + '-' + keyid;
      value = {
        "added": Date.now(),
        "TTL": TTL,
        "data": data
      };
      Cache.type.setItem(key, JSON.stringify(value));
    },
    load: function () {
      var key, data, i, ii;

      for (i = 0, ii = Cache.type.length; i < ii; ++i) {
        key = Cache.type.key(i);
        if (key.match(Main.namespace + 'gallery')) {
          data = Cache.get(key.match(/\d+/));
          if (data) {
            Database.set(data);
          }
        }
      }
    }
  };
  Database = {}; $.extend(Database, {
    check: function (uid) {
      var data;
      if (Database[uid]) {
        return Database[uid].token;
      }
      else {
        data = Cache.get(uid);
        if (data) {
          Database.set(data);
          return data.token;
        }
        return false;
      }
    },
    get: function (uid) { // , debug
      // Use this if you want to break database gets randomly for debugging
      // if (arguments[1] === true && Math.random() > 0.8) return false;
      var data;
      if (Database[uid]) {
        return Database[uid];
      }
      else {
        data = Cache.get(uid);
        if (data) {
          Database.set(data);
          return data;
        }
        return false;
      }
    },
    set: function (data) {
      var uid = data.gid;
      Database[uid] = data;
      Cache.set(data);
    },
    usage: function (uid) {
      if (!Database.usage.data[uid]) Database.usage.data[uid] = 0;
      return Database.usage.data[uid]++;
    },
    init: function () {
      $.extend(Database.usage, {
        data: {}
      });
      if (conf['Populate Database on Load'] === true) {
        Cache.load();
      }
    }
  });
  Hash = {
    md5: {},
    sha1: {},
    get: function (hash, type) {
      var result;
      if (Hash[type][hash]) {
        return Hash[type][hash];
      }
      else {
        result = Cache.get(hash, type);
        if (result) {
          Hash[type][hash] = result;
          return result;
        }
        return false;
      }
    },
    set: function (data, type, hash) {
      var ttl = (type === 'md5') ? 365 * t.DAY : 12 * t.HOUR;
      Cache.set(data, type, hash, ttl);
    }
  };
  SHA1 = {
    // SHA-1 JS implementation originally created by Chris Verness
    // http://www.movable-type.co.uk/scripts/sha1.html
    data: function (image) {
      var string = '',
        i, ii;
      for (i = 0, ii = image.length; i < ii; ++i) {
          string += String.fromCharCode(image[i].charCodeAt(0) & 0xff);
      }
      return string;
    },
    f: function (s, x, y, z) {
      switch (s) {
        case 0: return (x & y) ^ (~x & z);
        case 1: return x ^ y ^ z;
        case 2: return (x & y) ^ (x & z) ^ (y & z);
        case 3: return x ^ y ^ z;
      }
    },
    ROTL: function (x, n) {
      return (x << n) | (x >>> (32 - n));
    },
    hex: function (str) {
      var s = '',
        v, i;
      for (i = 7; i >= 0; --i) {
        v = (str >>> (i * 4)) & 0xf;
        s += v.toString(16);
      }
      return s;
    },
    hash: function (image) {
      var H0, H1, H2, H3, H4, K, M, N, W, T,
        a, b, c, d, e, i, j, l, s, msg;

      K = [ 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6 ];
      msg = SHA1.data(image) + String.fromCharCode(0x80);

      l = msg.length / 4 + 2;
      N = Math.ceil(l / 16);
      M = [];

      for (i = 0; i < N; ++i) {
        M[i] = [];
        for (j = 0; j < 16; ++j) {
          M[i][j] = (msg.charCodeAt(i * 64 + j * 4) << 24) |
            (msg.charCodeAt(i * 64 + j * 4 + 1) << 16) |
            (msg.charCodeAt(i * 64 + j * 4 + 2) << 8) |
            (msg.charCodeAt(i * 64 + j * 4 + 3));
        }
      }

      M[N - 1][14] = Math.floor(((msg.length - 1) * 8) / Math.pow(2, 32));
      M[N - 1][15] = ((msg.length - 1) * 8) & 0xffffffff;

      H0 = 0x67452301;
      H1 = 0xefcdab89;
      H2 = 0x98badcfe;
      H3 = 0x10325476;
      H4 = 0xc3d2e1f0;

      W = [];

      for (i = 0; i < N; ++i) {
        for (j = 0; j < 16; ++j) {
          W[j] = M[i][j];
        }
        for (j = 16; j < 80; ++j) {
          W[j] = SHA1.ROTL(W[j - 3] ^ W[j - 8] ^ W[j - 14] ^ W[j - 16], 1);
        }

        a = H0;
        b = H1;
        c = H2;
        d = H3;
        e = H4;

        for (j = 0; j < 80; ++j) {
          s = Math.floor(j / 20);
          T = (SHA1.ROTL(a, 5) + SHA1.f(s, b, c, d) + e + K[s] + W[j]) & 0xffffffff;
          e = d;
          d = c;
          c = SHA1.ROTL(b, 30);
          b = a;
          a = T;
        }

        H0 = (H0 + a) & 0xffffffff;
        H1 = (H1 + b) & 0xffffffff;
        H2 = (H2 + c) & 0xffffffff;
        H3 = (H3 + d) & 0xffffffff;
        H4 = (H4 + e) & 0xffffffff;
      }

      return SHA1.hex(H0) + SHA1.hex(H1) + SHA1.hex(H2) + SHA1.hex(H3) + SHA1.hex(H4);
    }
  };
  Sauce = {
    UI: {
      toggle: function (e) {
        e.preventDefault();
        var a = e.target,
          results = $.id(a.id.replace('exsauce', 'exresults')),
          sha1 = a.getAttribute('data-sha1'),
          hover;

        if (results.style.display === "table") {
          results.style.display = "none";
          if (conf['Show Short Results'] === true) {
            $.on(a, [
              [ 'mouseover', Sauce.UI.show ],
              [ 'mousemove', Sauce.UI.move ],
              [ 'mouseout', Sauce.UI.hide ]
            ]);
          }
        }
        else { // if (style.match('none')) {
          results.style.display = "table";
          if (conf['Show Short Results'] === true) {
            $.off(a, [
              [ 'mouseover', Sauce.UI.show ],
              [ 'mousemove', Sauce.UI.move ],
              [ 'mouseout', Sauce.UI.hide ]
            ]);
            hover = $.id('exhover-' + sha1);
            hover.style.setProperty("display", "none", "important");
          }
        }
      },
      show: function (e) {
        var a = e.target,
          sha1 = a.getAttribute('data-sha1'),
          hover = $.id('exhover-' + sha1);

        if (hover) {
          hover.style.setProperty("display", "table", "important");
        }
        else {
          Sauce.UI.hover(sha1);
        }
      },
      hide: function (e) {
        var a = e.target,
          sha1 = a.getAttribute('data-sha1'),
          hover = $.id('exhover-' + sha1);

        if (hover) {
          hover.style.setProperty("display", "none", "important");
        }
        else {
          Sauce.UI.hover(sha1);
        }
      },
      move: function (e) {
        var a = e.target,
          sha1 = a.getAttribute('data-sha1'),
          hover = $.id('exhover-' + sha1);

        if (hover) {
          hover.style.setProperty("display", "table", "important");
          hover.style.left = (e.clientX + 12) + 'px';
          hover.style.top = (e.clientY + 22) + 'px';
        }
        else {
          Sauce.UI.hover(sha1);
        }
      },
      hover: function (sha1) {
        var result = Hash.get(sha1, 'sha1'),
          hover, i, ii;

        hover = $.create('div', {
          className: 'exblock exhover post reply',
          id: 'exhover-' + sha1
        });

        for (i = 0, ii = result.length; i < ii; ++i) {
          hover.innerHTML += '<a class="exsauce-hover" href="' + result[i][0] + '">' + result[i][1] + '</a>';
          if (i < ii - 1) hover.innerHTML += '<br />';
        }
        hover.style.setProperty("display", "table", "important");
        $.add(d.body, hover);
      }
    },
    format: function (a, result) {
      var count = result.length,
        results, parent, post, i, ii;
      a.classList.add('sauced');
      a.textContent = Sauce.text('Found: ' + count);
      if (count > 0) {
        if (conf['Inline Results'] === true) {
          $.on(a, 'click', Sauce.UI.toggle);
          results = $.create('div', {
            className: 'exblock exresults',
            id: a.id.replace('exsauce', 'exresults'),
            innerHTML: '<b>Reverse Image Search Results</b> | View on: <a href="' + a.href + '">' + Sauce.label(true) + '</a><br />'
          });
          results.style.setProperty("display", conf['Show Results by Default'] ? "table" : "none", "important");
          for (i = 0, ii = result.length; i < ii; ++i) {
            results.appendChild($.tnode(result[i][0]));
            if (i < ii - 1) results.appendChild($.create('br'));
          }
          if (Config.mode === '4chan') {
            parent = a.parentNode.parentNode.parentNode;
            post = $(Parser.postbody, parent);
            $.before(post, results);
          }
          Main.process([results]);
        }
        if (conf['Show Results by Default'] === false) {
          if (conf['Show Short Results'] === true) {
            $.on(a, [
              [ 'mouseover', Sauce.UI.show ],
              [ 'mousemove', Sauce.UI.move ],
              [ 'mouseout', Sauce.UI.hide ]
            ]);
          }
        }
      }
      Debug.log('Formatting complete.');
    },
    lookup: function (a, sha1) {
      a.textContent = Sauce.text('Checking');

      GM_xmlhttpRequest({
        method: "GET",
        url: a.href,
        onload: function (xhr) {
          var result = [],
            response = $.frag(xhr.responseText),
            links = $$('div.it5 a,div.id2 a', response),
            link, i, ii;

          for (i = 0, ii = links.length; i < ii; ++i) {
              link = links[i];
              result.push([ link.href, link.innerHTML ]);
          }

          Hash.set(result, 'sha1', sha1);
          Debug.log('Lookup successful. Formatting.');
          if (conf['Show Short Results']) Sauce.UI.hover(sha1);
          Sauce.format(a, result);
        }
      });
    },
    hash: function (a, md5) {
      Debug.log('Fetching image ' + a.href);
      a.textContent = Sauce.text('Loading');
      GM_xmlhttpRequest({
        method: "GET",
        url: a.href,
        overrideMimeType: "text/plain; charset=x-user-defined",
        headers: { "Content-Type": "image/jpeg" },
        onload: function (x) {
          var sha1 = SHA1.hash(x.responseText);
          a.textContent = Sauce.text('Hashing');
          a.setAttribute('data-sha1', sha1);
          Hash.set(sha1, 'md5', md5);
          Debug.log('SHA-1 hash for image: ' + sha1);
          Sauce.check(a);
        }
      });
    },
    check: function (a) {
      var md5, sha1, result;
      if (a.hasAttribute('data-sha1')) {
        sha1 = a.getAttribute('data-sha1');
      }
      else {
        md5 = a.getAttribute('data-md5');
        sha1 = Hash.get(md5, 'md5');
      }
      if (sha1) {
        Debug.log('SHA-1 hash found.');
        a.setAttribute('data-sha1', sha1);
        a.href = 'http://' + conf['Site to Use'].value + '/?f_doujinshi=1&f_manga=1&f_artistcg=1&f_gamecg=1&f_western=1&f_non-h=1&f_imageset=1&f_cosplay=1&f_asianporn=1&f_misc=1&f_search=Search+Keywords&f_apply=Apply+Filter&f_shash=' + sha1 + '&fs_similar=0';
        if (conf['Search Expunged'] === true) a.href += '&fs_exp=1';
        a.setAttribute('target', '_blank');
        result = Hash.get(sha1, 'sha1');
        if (result) {
          Debug.log('Cached result found. Formatting.');
          Sauce.format(a, result);
        }
        else {
          Debug.log('No cached result found. Performing a lookup.');
          Sauce.lookup(a, sha1);
        }
      }
      else {
        Debug.log('No SHA-1 hash found. Fetching image.');
        Sauce.hash(a, md5);
      }
    },
    click: function (e) {
      e.preventDefault();
      $.off(e.target, 'click', Sauce.click);
      Sauce.check(e.target);
    },
    label: function (siteonly) {
      var label = (conf['Site to Use'].value === 'exhentai.org') ? 'ExHentai' : 'E-Hentai';//'ExSauce';

      if (!siteonly) {
        if (conf['Use Custom Label'] === true) {
          label = conf['Custom Label Text'];
        }
      }
      if (Config.mode === '4chan') {
        if (conf['Lowercase on 4chan'] === true) {
          label = label.toLowerCase();
        }
      }
      return label;
    },
    text: function (text) {
      return (Config.mode === '4chan' && conf['Lowercase on 4chan']) ? text.toLowerCase() : text;
    }
  };
  Parser = {
    postbody: 'blockquote',
    prelinks: 'a:not(.quotelink)',
    links: '.exlink',
    image: '.file',
    unformatted: function (uid) {
      var results = [],
        links = $$('a.uid-' + uid),
        i, ii;
      for (i = 0, ii = links.length; i < ii; ++i) {
        if (links[i].classList.contains('exprocessed')) {
          results.push(links[i]);
        }
      }
      return results;
    },
    linkify: function (post) {
      var ws = /^\s*$/,
        nodes = $.textnodes(post),
        node, text, match, linknode, sp, ml, tn, tl, tu, wbr, i, ii;

      if (nodes.length > 0) {
        for (i = 0, ii = nodes.length; i < ii; ++i) {
          node = nodes[i];
          if (regex.url.test(node.textContent)) {
            wbr = i;
            while (nodes[wbr] && nodes[wbr].nextSibling && nodes[wbr].nextSibling.tagName === "WBR") {
              nodes[wbr].parentNode.removeChild(nodes[wbr].nextSibling);
              if (nodes[wbr + 1]) {
                node.textContent += nodes[wbr + 1].textContent;
                nodes[wbr + 1].textContent = "";
              }
              ++wbr;
            }
          }
          text = node.textContent;
          match = text.match(regex.url);
          tl = "";
          linknode = match ? [] : null;
          while (match) {
            sp = text.search(regex.url);
            ml = match[0].length - 1;
            tn = $.tnode(text.substr(0, sp));
            tl = text.substr(sp + ml + 1, text.length);
            tu = $.create('a');
            tu.className = 'exlink exgallery exunprocessed';
            if (match[0].match(regex.protocol)) {
              tu.href = match[0];
              tu.innerHTML = match[0];
            }
            else {
              tu.href = 'http://' + match[0];
              tu.innerHTML = 'http://' + match[0];
            }
            tu.setAttribute('target', '_blank');
            tu.style.textDecoration = 'none';
            if (tn.length > 0 && !ws.test(tn.nodeValue)) {
              linknode.push(tn);
            }
            linknode.push(tu);
            text = tl;
            match = text.match(regex.url);
          }
          if (tl.length > 0) {
            linknode.push($.tnode(tl));
          }
          if (linknode) {
            $.replace(node, $.elem(linknode));
          }
        }
      }
    }
  };
  Options = {
    save: function (e) {
      e.preventDefault();
      Config.save();
      $.remove($.id('exlinks-overlay'));
      d.body.style.overflow = 'visible';
    },
    close: function (e) {
      e.preventDefault();
      tempconf = JSON.parse(JSON.stringify(pageconf));
      $.remove($.id('exlinks-overlay'));
      d.body.style.overflow = 'visible';
    },
    toggle: function (e) {
      var option = e.target,
        type = option.getAttribute('type'),
        domain = {
          "1": fetch.original,
          "2": fetch.geHentai,
          "3": fetch.exHentai
        };

      if (type === 'checkbox') {
        tempconf[option.name] = (option.checked ? true : false);
      }
      else if (type === 'domain' || type === 'saucedomain') {
        tempconf[option.name] = domain[option.value];
      }
      else if (type === 'text' || option.tagName === "TEXTAREA") {
        tempconf[option.name] = option.value;
      }
    },
    open: function () {
      pageconf = JSON.parse(JSON.stringify(tempconf));

      var overlay = $.frag(UI.html.options()),
        over = overlay.firstChild,
        frag = d.createDocumentFragment(),
        gen;

      frag.appendChild(overlay);
      $.add(d.body, frag);
      $.on($.id('exlinks-options-save'), 'click', Options.save);
      $.on($.id('exlinks-options-cancel'), 'click', Options.close);
      $.on(over, 'click', Options.close);
      $.on($.id('exlinks-options'), 'click', function (e) { e.stopPropagation(); });
      d.body.style.overflow = 'hidden';

      gen = function (target, obj) {
        var desc, tr, type, value, i;
        for (i in obj) {
          desc = obj[i][2];
          type = obj[i][0];
          value = tempconf[i];
          tr = $.create('tr');
          if (type === 'checkbox') {
            tr.innerHTML = [
              '<td style="padding:3px;">',
              '<input style="float:right;margin-right:2px;" type="checkbox" id="' + i + '" name="' + i + '"' + (value ? ' checked' : '') + ' />',
              '<label for="' + i + '"><b>' + i + ':</b> ' + desc + '</label>',
              '</td>'
            ].join('');
            $.on($('input', tr), 'change', Options.toggle);
          }
          else if (type === 'domain') {
            tr.innerHTML = [
              '<td style="padding:3px;">',
              '<select name="' + i + '" type="domain" style="font-size:0.92em!important;float:right;width:18%;">',
                '<option value="1"' + (value.value === 'Original' ? ' selected' : '') + '>Original</option>',
                '<option value="2"' + (value.value === 'g.e-hentai.org' ? ' selected' : '') + '>g.e-hentai.org</option>',
                '<option value="3"' + (value.value === 'exhentai.org' ? ' selected' : '') + '>exhentai.org</option></select>',
              '<b>' + i + ':</b> ' + desc + '</td>'
            ].join('');
            $.on($('select', tr), 'change', Options.toggle);
          }
          else if (type === 'saucedomain') {
            tr.innerHTML = [
              '<td style="padding:3px;">',
              '<select name="' + i + '" type="domain" style="font-size:0.92em!important;float:right;width:18%;">',
                '<option value="2"' + (value.value === 'g.e-hentai.org' ? ' selected' : '') + '>g.e-hentai.org</option>',
                '<option value="3"' + (value.value === 'exhentai.org' ? ' selected' : '') + '>exhentai.org</option></select>',
              '<b>' + i + ':</b> ' + desc + '</td>'
            ].join('');
            $.on($('select', tr), 'change', Options.toggle);
          }
          else if (type === 'textbox') {
            tr.innerHTML = [
              '<td style="padding:3px;">',
              '<input style="float:right;padding-left:5px;width:18%;font-size:0.92em!important;" type="text" id="' + i + '" name="' + i + '" />',
              '<b>' + i + ':</b> ' + desc + '</td>'
            ].join('');
            $('input', tr).value = value;
            $.on($('input', tr), 'input', Options.toggle);
          }
          else if (type === 'textarea') {
            tr.innerHTML = [
              '<td style="padding:3px;">',
              '<b>' + i + ':</b> ' + desc + '<br />',
              '<textarea style="display:block;width:100%;height:7em;line-height:1.2em;padding:0.5em;box-sizing:border-box;resize:vertical;font-size:0.92em!important;" wrap="off" autocomplete="off" spellcheck="false" id="' + i + '" name="' + i + '"></textarea>',
              '</td>'
            ].join('');
            $('textarea', tr).value = value;
            $.on($('textarea', tr), 'input', Options.toggle);
          }
          $.add(target, tr);
        }
      };

      gen($.id('exlinks-options-general'), options.general);
      gen($.id('exlinks-options-actions'), options.actions);
      gen($.id('exlinks-options-sauce'), options.sauce);
      gen($.id('exlinks-options-domains'), options.domains);
      gen($.id('exlinks-options-debug'), options.debug);
      gen($.id('exlinks-options-filter'), options.filter);
      $.on($("input.exlinks-options-color-input[type=color]"), 'change', Filter.settings_color_change);
    },
    init: function () {
      var oneechan = $.id('OneeChanLink'),
        chanss = $.id('themeoptionsLink'),
        conflink, conflink2, arrtop, arrbot;

      Main["4chanX3"] = d.documentElement.classList.contains("fourchan-x");
      conflink = $.create('a', { title: 'ExLinks Settings', className: 'exlinksOptionsLink entry' });
      $.on(conflink, 'click', Options.open);

      if (Config.mode === '4chan') {
        if (oneechan) {
          conflink.setAttribute('style', 'position: fixed; background: url(' + img.options + '); top: 108px; right: 10px; left: auto; width: 15px; height: 15px; opacity: 0.75; z-index: 5;');
          $.on(conflink, [
            [ 'mouseover', function (e) { e.target.style.opacity = 1.0; } ],
            [ 'mouseout', function (e) { e.target.style.opacity = 0.65; } ]
          ]);
          $.add(d.body, conflink);
        }
        else if (chanss) {
          conflink.innerHTML = 'Ex';
          conflink.setAttribute('style', 'background-image: url(' + img.options + '); padding-top: 15px !important; opacity: 0.75;');
          $.on(conflink, [
            [ 'mouseover', function (e) { e.target.style.opacity = 1.0;} ],
            [ 'mouseout', function (e) { e.target.style.opacity = 0.65;} ]
          ]);
          $.add($.id('navtopright'), conflink);
        }
        else {
          conflink.innerHTML = 'ExLinks Settings';
          conflink.setAttribute('style', 'cursor: pointer; ' + conflink.getAttribute('style'));
          conflink2 = conflink.cloneNode(true);
          $.on(conflink2, 'click', Options.open);
          arrtop = [ $.tnode('['), conflink, $.tnode('] ') ];
          arrbot = [ $.tnode('['), conflink2, $.tnode('] ') ];
          $.prepend($.id('navtopright'), $.elem(arrtop));
          if ($.id('navbotright')) {
            $.prepend($.id('navbotright'), $.elem(arrbot));
          }
        }
      }
      else if (Config.mode === 'fuuka') {
        conflink.innerHTML = 'exlinks options';
        conflink.setAttribute('style', 'cursor: pointer; text-decoration: underline;');
        arrtop = [ $.tnode(' [ '), conflink, $.tnode(' ] ') ];
        $.add($('div'), $.elem(arrtop));
      }
      else if (Config.mode === 'foolz') {
        conflink.innerHTML = 'ExLinks Options';
        conflink.setAttribute('style', 'cursor: pointer;');
        arrtop = [ $.tnode(' [ '), conflink, $.tnode(' ] ') ];
        $.add($('.letters'), $.elem(arrtop));
      }
      else if (Config.mode === '38chan') {
        conflink.innerHTML = 'exlinks options';
        conflink.setAttribute('style', 'cursor: pointer;');
        conflink2 = conflink.cloneNode(true);
        $.on(conflink2, 'click', Options.open);
        arrtop = [ $.tnode('  [ '), conflink, $.tnode(' ] ') ];
        arrbot = [ $.tnode('  [ '), conflink2, $.tnode(' ] ') ];
        $.add($('.boardlist'), $.elem(arrtop));
        $.add($('.boardlist.bottom'), $.elem(arrbot));
      }
    }
  };
  Config = {
    mode: '4chan',
    link: function (url, opt) {
      if (opt.value === "Original") {
        if (url.match('exhentai.org')) return 'exhentai.org';
        if (url.match('g.e-hentai.org')) return 'g.e-hentai.org';
        return false;
      }
      if (opt.value === "g.e-hentai.org") return opt.value;
      return 'exhentai.org';
    },
    site: function () {
      var curSite = document.URL,
        curDocType = document.doctype,
        curType;

      if (curSite.match(/archive\.moe/)) {
        curType = [
          "<!DOCTYPE ",
          curDocType.name,
          (curDocType.publicId ? ' PUBLIC "' + curDocType.publicId + '"' : ''),
          (!curDocType.publicId && curDocType.systemId ? ' SYSTEM' : ''),
          (curDocType.systemId ? ' "' + curDocType.systemId + '"' : ''),
          '>'
        ].join('');

        if (curType.match('<!DOCTYPE html>')) {
          Config.mode = 'foolz';
          Parser.postbody = '.text';
          Parser.prelinks = 'a:not(.backlink)';
          Parser.image = '.thread_image_box';
        }
        else {
          Config.mode = 'fuuka';
          Parser.image = '.thumb';
        }
      }
      else if (curSite.match(/boards\.38chan\.net/)) {
        Config.mode = '38chan';
        Parser.postbody = '.post:not(.hidden)>.body';
        Parser.prelinks = 'a:not([onclick])';
        Parser.image = '.fileinfo';
      }
    },
    save: function () {
      for (var i in options) {
        for (var k in options[i]) {
          localStorage.setItem(Main.namespace + 'user-' + k, JSON.stringify(tempconf[k]));
        }
      }
    },
    init: function () {
      var temp, option, i, k;
      for (i in options) {
        for (k in options[i]) {
          temp = localStorage.getItem(Main.namespace + 'user-' + k);
          if (temp) {
            temp = JSON.parse(temp);
            conf[k] = temp;
          }
          else {
            option = JSON.stringify(options[i][k][1]);
            conf[k] = JSON.parse(option);
            localStorage.setItem(Main.namespace + 'user-' + k, option);
          }
        }
      }
      if (navigator.userAgent.match('Presto')) {
        conf.ExSauce = false;
      }
      tempconf = JSON.parse(JSON.stringify(conf));
    }
  };
  Filter = {
    title: null,
    tags: null,
    uploader: null,
    None: 0,
    Bad: -1,
    Good: 1,
    cache: {
      tags: {}
    },
    div: d.createElement("div"),
    Segment: function (start, end, data) {
      this.start = start;
      this.end = end;
      this.data = data;
    },
    MatchInfo: function () {
      this.matches = [];
      this.any = false;
      this.bad = false;
    },
    init: function () {
      Filter.title = Filter.parse(conf['Name Filter']);
      Filter.tags = Filter.parse(conf['Tag Filter']);
      Filter.uploader = Filter.parse(conf['Uploader Filter']);
    },
    genregex: function (pattern, flags) {
      if (flags.indexOf("g") < 0) {
        flags += "g";
      }
      try {
        return new RegExp(pattern, flags);
      }
      catch (e) {
        return null;
      }
    },
    parse: function (input) {
      var filters, lines, i, pos, pos2, flags, line, regex;
      filters = [];
      lines = (input || "").split("\n");
      for (i = 0; i < lines.length; ++i) {
        line = lines[i].trim();
        if (line[0] === "/" && (pos = line.lastIndexOf("/")) > 0) {
          pos2 = line.indexOf(";", pos + 1);

          regex = line.substr(1, pos - 1);
          flags = (pos2 > 0) ? line.substr(pos + 1, pos2 - pos - 1) : "";
          regex = Filter.genregex(regex, flags);

          if (regex) {
            pos = Math.max(pos, pos2) + 1;
            flags = (pos < line.length) ? Filter.parse_flags(line.substr(pos)) : null;
            filters.push({
              regex: regex,
              flags: flags
            });
          }
        }
      }
      return filters;
    },
    parse_flags: function (text) {
      var flaglist, flags, key, m, i;
      flags = {};
      flaglist = text.split(";");

      for (i = 0; i < flaglist.length; ++i) {
        if (flaglist[i].length > 0) {
          m = flaglist[i].split(":");
          key = m[0].trim().toLowerCase();
          m.splice(0, 1);
          flags[key] = m.join("").trim();
        }
      }

      return Filter.normalize_flags(flags);
    },
    normalize_flags: function (flags) {
      var norm = {}, any = false;

      if (flags.only) {
        norm.only = Filter.normalize_split(flags.only);
        any = true;
      }
      if (flags.not) {
        norm.not = Filter.normalize_split(flags.not);
        any = true;
      }
      if ("bad" in flags && ([ "", "true", "yes" ].indexOf(flags.bad.trim().toLowerCase()) >= 0)) {
        norm.bad = true;
        any = true;
      }
      if ("color" in flags) {
        norm.color = flags.color.trim();
        any = true;
      }
      if ("background" in flags) {
        norm.background = flags.background.trim();
        any = true;
      }
      if ("underline" in flags) {
        norm.underline = flags.underline.trim();
        any = true;
      }
      if ("link-color" in flags) {
        norm.link = {};
        norm.link.color = flags["link-color"].trim();
        any = true;
      }
      if ("link-background" in flags) {
        if (!norm.link) {
          norm.link = {};
        }
        norm.link.background = flags["link-background"].trim();
        any = true;
      }
      if ("link-underline" in flags) {
        if (!norm.link) {
          norm.link = {};
        }
        norm.link.underline = flags["link-underline"].trim();
        any = true;
      }

      return any ? norm : null;
    },
    normalize_split: function (text) {
      var array, i;
      array = text.split(",");
      for (i = 0; i < array.length; ++i) {
        array[i] = array[i].trim().toLowerCase();
      }
      return array;
    },
    normalize_api_string: function (text) {
      Filter.div.innerHTML = text;
      var t = Filter.div.textContent;
      Filter.div.textContent = "";
      return t;
    },
    matches_to_segments: function (text, matches) {
      var Segment, segments, fast, hit, m, s, i, j;

      Segment = Filter.Segment;
      segments = [ new Segment(0, text.length, []) ];
      fast = conf['Full Highlighting'];

      if (fast) {
        for (i = 0; i < matches.length; ++i) {
          segments[0].data.push(matches[i].data);
        }
      }
      else {
        for (i = 0; i < matches.length; ++i) {
          m = matches[i];
          hit = false;
          for (j = 0; j < segments.length; ++j) {
            s = segments[j];
            if (m.start < s.end && m.end > s.start) {
              hit = true;
              j = Filter.update_segments(segments, j, m, s);
            }
            else if (hit) {
              break;
            }
          }
        }
      }

      return segments;
    },
    update_segments: function (segments, pos, seg1, seg2) {
      var s1, s2, data;

      data = seg2.data.slice(0);
      seg2.data.push(seg1.data);

      if (seg1.start > seg2.start) {
        if (seg1.end < seg2.end) {
          // cut at both
          s1 = new Filter.Segment(seg2.start, seg1.start, data);
          s2 = new Filter.Segment(seg1.end, seg2.end, data.slice(0));
          seg2.start = seg1.start;
          seg2.end = seg1.end;
          segments.splice(pos, 0, s1);
          pos += 2;
          segments.splice(pos, 0, s2);
        }
        else {
          // cut at start
          s1 = new Filter.Segment(seg2.start, seg1.start, data);
          seg2.start = seg1.start;
          segments.splice(pos, 0, s1);
          pos += 1;
        }
      }
      else {
        if (seg1.end < seg2.end) {
          // cut at end
          s2 = new Filter.Segment(seg1.end, seg2.end, data);
          seg2.end = seg1.end;
          pos += 1;
          segments.splice(pos, 0, s2);
        }
        // else, cut at neither
      }

      return pos;
    },
    apply_styles: function (node, styles) {
      var color = null, background = null, underline = null, style, i, s;

      for (i = 0; i < styles.length; ++i) {
        style = styles[i];
        if ((s = style.color)) {
          color = s;
        }
        if ((s = style.background)) {
          background = s;
        }
        if ((s = style.underline)) {
          underline = s;
        }
      }

      Filter.apply_styling(node, color, background, underline);
    },
    apply_styling: function (node, color, background, underline) {
      if (color !== null) {
        node.style.setProperty("color", color, "important");
      }
      if (background !== null) {
        node.style.setProperty("background-color", background, "important");
      }
      if (underline !== null) {
        node.style.setProperty("border-bottom", "0.125em solid " + underline, "important");
      }
    },
    append_match_datas: function (matchinfo, target) {
      for (var i = 0, ii = matchinfo.matches.length; i < ii; ++i) {
        target.push(matchinfo.matches[i].data);
      }
    },
    remove_non_bad: function (list) {
      for (var i = 0; i < list.length; ) {
        if (!list[i].bad) {
          list.splice(i, 1);
          continue;
        }
        ++i;
      }
    },
    check_multiple: function (text, filters, data) {
      var info, match, i;
      info = new Filter.MatchInfo();
      for (i = 0; i < filters.length; ++i) {
        match = Filter.check_single(text, filters[i], data);
        if (match !== false) {
          info.any = true;
          if (match !== true) {
            info.matches.push(match);
            if (match.data.bad) {
              info.bad = true;
            }
          }
        }
      }
      return info;
    },
    check_single: function (text, filter, data) {
      var list, cat, i, m;

      filter.regex.lastIndex = 0;
      m = filter.regex.exec(text);
      if (filter.flags === null) {
        return (m !== null);
      }

      // Category filtering
      cat = data.category.toLowerCase();
      if ((list = filter.flags.only)) {
        for (i = 0; i < list.length; ++i) {
          if (list[i] === cat) {
            break;
          }
        }
        if (i >= list.length) {
          return false;
        }
      }
      if ((list = filter.flags.not)) {
        for (i = 0; i < list.length; ++i) {
          if (list[i] === cat) {
            return false;
          }
        }
      }

      // Text filter
      return (m === null) ? false : new Filter.Segment(m.index, m.index + m[0].length, filter.flags);
    },
    check: function (titlenode, data) {
      var status, str, tags, result, i, info;

      result = {
        tags: [],
        uploader: [],
        title: [],
      };

      // Title
      status = Filter.highlight("title", titlenode, data, result.title);

      // Uploader
      if (Filter.uploader.length > 0) {
        if ((str = data.uploader)) {
          str = Filter.normalize_api_string(str);
          info = Filter.check_multiple(str, Filter.uploader, data);
          if (info.any) {
            Filter.append_match_datas(info, result.uploader);
            if (info.bad) {
              status = Filter.Bad;
            }
            else if (status === Filter.None) {
              status = Filter.Good;
            }
          }
        }
      }

      // Tags
      if (Filter.tags.length > 0) {
        if ((tags = data.tags) && tags.length > 0) {
          for (i = 0; i < tags.length; ++i) {
            info = Filter.check_multiple(tags[i], Filter.tags, data);
            if (info.any) {
              Filter.append_match_datas(info, result.tags);
              if (info.bad) {
                status = Filter.Bad;
              }
              else if (status === Filter.None) {
                status = Filter.Good;
              }
            }
          }
          // Remove dups
          result.tags = result.tags.filter(function (item, pos, self) {
            return (self.indexOf(item) === pos);
          });
        }
      }

      // Remove non-bad filters on result.tags and result.uploader
      if (status === Filter.Bad) {
        Filter.remove_non_bad(result.uploader);
        Filter.remove_non_bad(result.tags);
      }

      return [ status , (status === Filter.None ? null : result) ];
    },
    highlight: function (mode, node, data, results) {
      if (Filter.title === null) {
        Filter.init();
      }

      var filters, info, matches, text, frag, segment, cache, i, t, n1, n2;

      filters = Filter[mode];
      if (filters.length === 0) {
        return Filter.None;
      }

      var hl_return = function (bad, node) {
        if (bad) {
          node.classList.add("exfilter-bad");
          return Filter.Bad;
        }
        else {
          node.classList.add("exfilter-good");
          return Filter.Good;
        }
      };

      // Cache for tags
      text = node.textContent;
      if ((cache = Filter.cache[mode]) !== undefined && (n1 = cache[text]) !== undefined) {
        if (n1 === null) {
          return Filter.None;
        }

        // Clone
        n1 = n1.cloneNode(true);
        node.innerHTML = "";
        while ((n2 = n1.firstChild) !== null) {
          node.appendChild(n2);
        }
        return hl_return(n1.classList.contains("exfilter-bad"), node);
      }

      // Check filters
      info = Filter.check_multiple(text, filters, data);
      if (!info.any) {
        if (cache !== undefined) {
          cache[text] = null;
        }
        return Filter.None;
      }

      // If bad, remove all non-bad filters
      if (info.bad) {
        for (i = 0; i < info.matches.length; ) {
          if (!info.matches[i].data.bad) {
            info.matches.splice(i, 1);
            continue;
          }
          ++i;
        }
      }

      // Results
      if (results !== null) {
        Filter.append_match_datas(info, results);
      }

      // Merge
      matches = Filter.matches_to_segments(text, info.matches);

      frag = d.createDocumentFragment();
      for (i = 0; i < matches.length; ++i) {
        segment = matches[i];
        t = text.substring(segment.start, segment.end);
        if (segment.data.length === 0) {
          frag.appendChild($.tnode(t));
        }
        else {
          n1 = $.create("span", { className: "exfilter-text" });
          n2 = $.create("span", { className: "exfilter-text-inner" });
          n2.textContent = t;
          n1.appendChild(n2);
          frag.appendChild(n1);
          Filter.apply_styles(n1, segment.data);
        }
      }

      // Replace
      node.innerHTML = "";
      node.appendChild(frag);
      if (cache !== undefined) {
        cache[text] = node;
      }
      return hl_return(info.bad, node);
    },
    highlight_tag: function (node, link, filter_data) {
      if (filter_data[0] === Filter.Bad) {
        node.classList.add("exfilter-bad");
        link.classList.add("exfilter-bad");
        link.classList.remove("exfilter-good");
      }
      else {
        node.classList.add("exfilter-good");
        link.classList.add("exfilter-good");
      }

      // Get styles
      var color = null, background = null, underline = null, n, n1, n2;

      var get_style = function (styles) {
        var i, s, style;
        for (i = 0; i < styles.length; ++i) {
          if ((style = styles[i].link) !== undefined) {
            if ((s = style.color)) {
              color = s;
            }
            if ((s = style.background)) {
              background = s;
            }
            if ((s = style.underline)) {
              underline = s;
            }
          }
        }
      };

      get_style(filter_data[1].uploader);
      get_style(filter_data[1].title);
      get_style(filter_data[1].tags);

      // Apply styles
      if (color !== null || background !== null || underline !== null) {
        n1 = $.create("span", { className: "exfilter-text" });
        n2 = $.create("span", { className: "exfilter-text-inner" });
        while ((n = node.firstChild) !== null) {
          n2.appendChild(n);
        }
        n1.appendChild(n2);
        node.appendChild(n1);
        Filter.apply_styling(n1, color, background, underline);
      }
    },
    settings_color_change: function () {
      var n = this.nextSibling, m;
      if (n) {
        n.value = this.value.toUpperCase();
        n = n.nextSibling;
        if (n) {
          m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(this.value);
          if (m !== null) {
            n.value = "rgba(" + parseInt(m[1], 16) + "," + parseInt(m[2], 16) + "," + parseInt(m[3], 16) + ",1)";
          }
        }
      }
    }
  };
  Theme = {
    current: "light",
    get: function () {
      return (Theme.current === "light" ? " extheme" : " extheme extheme-dark");
    },
    prepare: function (first) {
      Theme.update(!first);

      var add_mo = function (nodes, init, callback) {
        var MO = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,
          mo, i;

        if (!MO) return;

        mo = new MO(callback);
        for (i = 0; i < nodes.length; ++i) {
          mo.observe(nodes[i], init);
        }
      };

      add_mo([document.head], { childList: true }, function (records) {
        var update = false,
          nodes, i, j, tag;

        outer:
        for (i = 0; i < records.length; ++i) {
          if ((nodes = records[i].addedNodes)) {
            for (j = 0; j < nodes.length; ++j) {
              tag = nodes[j].tagName;
              if (tag === "STYLE" || tag === "LINK") {
                update = true;
                break outer;
              }
            }
          }
          if ((nodes = records[i].removedNodes)) {
            for (j = 0; j < nodes.length; ++j) {
              tag = nodes[j].tagName;
              if (tag === "STYLE" || tag === "LINK") {
                update = true;
                break outer;
              }
            }
          }
        }

        if (update) {
          Theme.update();
        }
      });
    },
    update: function (update_nodes) {
      var new_theme = Theme.detect();
      if (new_theme !== null && new_theme !== Theme.current) {
        if (update_nodes) {
          var nodes = document.querySelectorAll("extheme"),
            cls, i;
          if (new_theme === "light") {
            cls = "extheme-" + Theme.current;
            for (i = 0; i < nodes.length; ++i) {
              nodes.classList.remove(cls);
            }
          }
          else {
            cls = "extheme-" + new_theme;
            for (i = 0; i < nodes.length; ++i) {
              nodes.classList.add(cls);
            }
          }
        }
        Theme.current = new_theme;
      }
    },
    detect: function () {
      var doc_el = document.documentElement,
        body = document.querySelector("body"),
        n = document.createElement("div"),
        color, colors, i, j, a, a_inv;

      if (!body || !doc_el) {
        return null;
      }

      n.className = "post reply post_wrapper";
      body.appendChild(n);

      color = Theme.parse_css_color(window.getComputedStyle(doc_el).backgroundColor);
      colors = [
        Theme.parse_css_color(window.getComputedStyle(body).backgroundColor),
        Theme.parse_css_color(window.getComputedStyle(n).backgroundColor),
      ];

      body.removeChild(n);

      for (i = 0; i < colors.length; ++i) {
        a = colors[i][3];
        a_inv = (1.0 - a) * color[3];

        for (j = 0; j < 3; ++j) {
          color[j] = (color[j] * a_inv + colors[i][j] * a);
        }
        color[3] = Math.max(color[3], a);
      }

      if (color[3] === 0) {
        return null;
      }

      return (color[0] + color[1] + color[2] < 384) ? "dark" : "light";
    },
    parse_css_color: function (color) {
      if (color !== "transparent") {
        var m;
        if ((m = /^rgba?\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*(,\s*([0-9\.]+)\s*)?\)$/.exec(color))) {
          return [
            parseInt(m[1], 10),
            parseInt(m[2], 10),
            parseInt(m[3], 10),
            m[4] === undefined ? 1 : parseFloat(m[4])
          ];
        }
        else if ((m = /^#([0-9a-fA-F]{3,})$/.exec(color))) {
          if ((m = m[1]).length === 6) {
            return [
              parseInt(m.substr(0, 2), 16),
              parseInt(m.substr(2, 2), 16),
              parseInt(m.substr(4, 2), 16),
              1
            ];
          }
          else {
            return [
              parseInt(m[0], 16),
              parseInt(m[1], 16),
              parseInt(m[2], 16),
              1
            ];
          }
        }
      }

      return [ 0 , 0 , 0 , 0 ];
    }
  };
  Main = {
    namespace: 'exlinks-',
    version: '#VERSION#',
    check: function (uid) {
      var check = Database.check(uid),
        links, link, type, token, page, i, ii;

      if (!check) {
        links = Parser.unformatted(uid);
        for (i = 0, ii = links.length; i < ii; ++i) {
          link = links[i];
          type = link.className.match(regex.type)[1];
          if (type === 's') {
            page = link.className.match(regex.page);
          }
          else if (type === 'g') {
            token = link.className.match(regex.token);
            break;
          }
        }
        if (type === 's') {
          API.queue.add('s', uid, page[1], page[2]);
          return [ uid, type ];
        }
        else if (type === 'g') {
          API.queue.add('g', uid, token[1]);
          return [ uid, type ];
        }
      }
      else {
        Main.queue.add(uid);
        return [ uid, 'f' ];
      }
    },
    format: function (queue) {
      Debug.timer.start('format');
      Debug.value.set('failed', 0);

      var failed = {},
        failtype = [],
        uid, links, link, button, data, actions, failure, hl, i, ii, j, jj, k, c;

      for (i = 0, ii = queue.length; i < ii; ++i) {
        uid = queue[i];
        data = Database.get(uid);
        links = Parser.unformatted(uid);
        if (data) {
          if (!data.hasOwnProperty('error')) {
            Debug.value.add('formatlinks');
            for (j = 0, jj = links.length; j < jj; ++j) {
              link = links[j];
              button = $.id(link.id.replace('gallery', 'button'));
              link.innerHTML = data.title;

              if ((hl = Filter.check(link, data))[0] !== Filter.None) {
                c = (hl[0] === Filter.Good) ? conf['Good Tag Marker'] : conf['Bad Tag Marker'];
                button.textContent = button.textContent.replace(/\]\s*$/, c + "]");
                Filter.highlight_tag(button, link, hl);
              }

              $.off(button, 'click', Main.singlelink);
              if (conf['Gallery Details'] === true) {
                $.on(link, [
                  [ 'mouseover', UI.show ],
                  [ 'mouseout', UI.hide ],
                  [ 'mousemove', UI.move ]
                ]);
              }
              if (conf['Gallery Actions'] === true) {
                $.on(button, 'click', UI.toggle);
              }
              actions = UI.actions(data, link);
              $.after(link, actions);
              actions = $.id(link.id.replace('exlink-gallery', 'exblock-actions'));
              if (conf['Torrent Popup'] === true) {
                $.on($('a.extorrent', actions), 'click', UI.popup);
              }
              if (conf['Archiver Popup'] === true) {
                $.on($('a.exarchiver', actions), 'click', UI.popup);
              }
              if (conf['Favorite Popup'] === true) {
                $.on($('a.exfavorite', actions), 'click', UI.popup);
              }
              link.classList.remove('exprocessed');
              link.classList.add('exformatted');
              button.classList.remove('exfetch');
              button.classList.add('extoggle');
            }
          }
          else {
            for (j = 0, jj = links.length; j < jj; ++j) {
              link = links[j];
              button = $.id(link.id.replace('gallery', 'button'));
              link.innerHTML = 'Incorrect Gallery Key';
              $.off(button, 'click', Main.singlelink);
              link.classList.remove('exprocessed');
              link.classList.add('exformatted');
              button.classList.remove('exfetch');
              button.classList.add('extoggle');
            }
          }
        }
        else {
          Debug.value.add('failed');
          failed[uid] = true;
        }
      }

      Main.queue.clear();
      Debug.log('Formatted IDs: ' + Debug.value.get('formatlinks') + ' OK, ' + Debug.value.get('failed') + ' FAIL. Time: ' + Debug.timer.stop('format'));
      if (Object.keys(failed).length > 0) {
        for (k in failed) {
          failure = Main.check(parseInt(k, 10));
          failtype.push(failure[0]);
          failtype.push(failure[1]);
        }
        Debug.log([failtype]);
        Main.update();
      }
    },
    queue: function () {
      var arr = [],
        obj = Main.queue.list,
        i = 0,
        k;
      for (k in obj) {
        arr[i++] = parseInt(k, 10);
      }
      return arr;
    },
    update: function () {
      var queue = Main.queue();
      if (!API.working) {
        if (API.queue('s')) {
          API.request('s');
        }
        else if (API.queue('g')) {
          API.request('g');
        }
      }
      if (queue.length > 0) {
        Main.format(queue);
        Main.queue.clear();
      }
    },
    singlelink: function (e) {
      e.preventDefault();
      Main.single($.id(e.target.id.replace('button', 'gallery')));
      Main.update();
    },
    single: function (link) {
      var type = link.className.match(regex.type)[1],
        uid = link.className.match(regex.uid)[1],
        token = link.className.match(regex.token),
        page = link.className.match(regex.page),
        check;

      if (type === 's') {
        check = Database.check(uid);
        if (check) {
          type = 'g';
          token = check;
          link.classList.remove('type-s');
          link.classList.remove('page-' + page[1] + '-' + page[2]);
          link.classList.add('type-g');
          link.classList.add('token-' + token);
          Main.queue.add(uid);
        }
        else {
          API.queue.add('s', uid, page[1], page[2]);
        }
      }
      else if (type === 'g') {
        check = Database.check(uid);
        if (check) {
          Main.queue.add(uid);
        }
        else {
          API.queue.add('g', uid, token[1]);
        }
      }
    },
    process: function (posts) {
      var post, file, info, sauce, exsauce, md5, sha1, results, saucestyle,
        actions, prelinks, prelink, links, link, site, prevent,
        type, gid, sid, uid, button, usage, linkified, isJPG, i, ii, j, jj;

      Debug.timer.start('process');
      Debug.value.set('post_total', posts.length);

      prevent = function (e) {
        e.preventDefault();
        return false;
      };

      for (i = 0, ii = posts.length; i < ii; ++i) {
        post = posts[i];
        if (conf.ExSauce === true) {
          // Needs redoing to make life easier with archive
          if (!post.classList.contains('exresults')) {
            if ($(Parser.image, post.parentNode)) {
              if (Config.mode === '4chan') {
                file = $(Parser.image, post.parentNode);
                if (file.childNodes.length > 1) {
                  info = file.childNodes[0];
                  md5 = file.childNodes[1].firstChild.getAttribute('data-md5');
                  isJPG = file.childNodes[1].href.match(/\.jpg$/i);
                  if (md5) {
                    md5 = md5.replace('==', '');
                    sauce = $('.exsauce', info);
                    if (!sauce) {
                      exsauce = $.create('a', {
                        textContent: Sauce.label(),
                        className: 'exsauce',
                        id: 'exsauce-' + post.id,
                        href: file.childNodes[1].href
                      });
                      if (conf['No Underline on Sauce']) {
                        exsauce.classList.add('exsauce-no-underline');
                      }
                      exsauce.setAttribute('data-md5', md5);
                      if (isJPG) {
                        exsauce.classList.add('exsauce-disabled');
                        $.on(exsauce, 'click', prevent);
                        exsauce.title = "Reverse Image Search doesn't work for JPG images because 4chan manipulates them on upload. There is nothing ExLinks can do about this. All complaints can be directed at 4chan staff.";
                      }
                      else {
                        $.on(exsauce, 'click', Sauce.click);
                      }
                      $.add(info, $.tnode(" "));
                      $.add(info, exsauce);
                    }
                    else if (!isJPG) {
                      if (!sauce.classList.contains('sauced')) {
                        $.on(sauce, 'click', Sauce.click);
                      }
                      else {
                        sha1 = sauce.getAttribute('data-sha1');
                        if (conf['Show Short Results'] === true) {
                          if (conf['Inline Results'] === true) {
                            results = $.id(sauce.id.replace('exsauce', 'exresults'));
                            if (saucestyle.style.display === 'none') {
                              $.on(sauce, [
                                [ 'mouseover', Sauce.UI.show],
                                [ 'mousemove', Sauce.UI.move],
                                [ 'mouseout', Sauce.UI.hide]
                              ]);
                            }
                          }
                          else {
                            $.on(sauce, [
                              [ 'mouseover', Sauce.UI.show ],
                              [ 'mousemove', Sauce.UI.move ],
                              [ 'mouseout', Sauce.UI.hide ]
                            ]);
                          }
                        }
                        if (conf['Inline Results'] === true) {
                          $.on(sauce, 'click', Sauce.UI.toggle);
                          if (conf['Hide Results in Quotes'] === true) {
                            results = $.id(sauce.id.replace('exsauce', 'exresults'));
                            results.style.setProperty("display", "none", "important");
                          }
                        }
                      }
                    }
                  }
                }
              }
              // else if (Config.mode === 'fuuka') // A WORLD OF PAIN
              // else if (Config.mode === 'foolz') // AWAITS
              // else if (Config.mode === '38chan') // Man, why doesn't Tinychan even have md5 hashes for images?
            }
          }
        }

        if (post.innerHTML.match(regex.url)) {
          Debug.value.add('posts');

          if (conf['Hide in Quotes']) {
            actions = $$('.exactions', post);
            for (j = 0, jj = actions.length; j < jj; ++j) {
              if (actions[j].display === "inline-block") {
                actions[j].display = "none";
              }
            }
          }
          if (!post.classList.contains('exlinkified')) {
            Debug.value.add('linkified');
            linkified = true;

            prelinks = $$(Parser.prelinks, post);
            if (prelinks) {
              for (j = 0, jj = prelinks.length; j < jj; ++j) {
                prelink = prelinks[j];
                if (prelink.href.match(regex.url)) {
                  prelink.classList.add('exlink');
                  prelink.classList.add('exgallery');
                  prelink.classList.add('exunprocessed');
                  prelink.style.textDecoration = 'none';
                  prelink.setAttribute('target', '_blank');
                }
              }
            }
            Parser.linkify(post);
            post.classList.add('exlinkified');
          }
          links = $$('a.exlink', post);
          for (j = 0, jj = links.length; j < jj; ++j) {
            link = links[j];
            if (link.classList.contains('exbutton')) {
              if (link.classList.contains('extoggle')) {
                if (conf['Gallery Actions'] === true) {
                  $.on(link, 'click', UI.toggle);
                }
              }
              if (link.classList.contains('exfetch')) {
                $.on(link, 'click', Main.singlelink);
              }
            }
            if (link.classList.contains('exaction')) {
              if (link.classList.contains('extorrent')) {
                if (conf['Torrent Popup'] === true) {
                  $.on(link, 'click', UI.popup);
                }
              }
              if (link.classList.contains('exarchiver')) {
                if (conf['Archiver Popup'] === true) {
                  $.on(link, 'click', UI.popup);
                }
              }
              if (link.classList.contains('extorrent')) {
                if (conf['Favorite Popup'] === true) {
                  $.on(link, 'click', UI.popup);
                }
              }
            }
            if (link.classList.contains('exgallery')) {
              if (link.classList.contains('exunprocessed')) {
                site = conf['Gallery Link'];
                if (site.value !== "Original") {
                  if (!link.href.match(site.value)) {
                    link.href = link.href.replace(regex.site, site.value);
                  }
                }
                type = link.href.match(regex.type);
                if (type) type = type[1];
                if (type === 's') {
                  sid = link.href.match(regex.sid);
                  if (sid) {
                    link.classList.add('type-s');
                    link.classList.add('uid-' + sid[2]);
                    link.classList.add('page-' + sid[1] + '-' + sid[3]);
                    uid = sid[2];
                  }
                  else {
                    type = null;
                  }
                }
                else if (type === 'g') {
                  gid = link.href.match(regex.gid);
                  if (gid) {
                    link.classList.add('type-g');
                    link.classList.add('uid-' + gid[1]);
                    link.classList.add('token-' + gid[2]);
                    uid = gid[1];
                  }
                  else {
                    type = null;
                  }
                }
                link.classList.remove('exunprocessed');
                if (type) {
                  link.classList.add('exprocessed');
                  usage = Database.usage(uid);
                  link.id = 'exlink-gallery-uid-' + uid + '-' + usage;
                  button = UI.button(link.href, link.id);
                  $.on(button, 'click', Main.singlelink);
                  $.before(link, button);
                }
                else {
                  link.classList.remove('exgallery');
                }
              }
              if (link.classList.contains('exprocessed')) {
                if (conf['Automatic Processing'] === true) {
                  Main.single(link);
                  Debug.value.add('processed');
                }
              }
              if (link.classList.contains('exformatted')) {
                if (conf['Gallery Details'] === true) {
                  $.on(link, [
                    [ 'mouseover', UI.show ],
                    [ 'mouseout', UI.hide ],
                    [ 'mousemove', UI.move ]
                  ]);
                }
              }
            }
            if (link.classList.contains('exfavorite')) {
              if (conf['Favorite Autosave']) {
                $.on(link, 'click', UI.favorite);
              }
            }
          }
        }

      }

      Debug.log('Total posts: ' + Debug.value.get('post_total') + ' Linkified: ' + Debug.value.get('linkified') + ' Processed: ' + Debug.value.get('posts') + ' Links: ' + Debug.value.get('processed') + ' Time: ' + Debug.timer.stop('process'));
      Main.update();
    },
    dom: function (e) {
      var node = e.target,
        nodelist = [];
      if (node.nodeName === 'DIV') {
        if (node.classList.contains('postContainer')) {
          nodelist.push($(Parser.postbody, node));
        }
        else if (node.classList.contains('inline')) {
          nodelist.push($(Parser.postbody, node));
        }
      }
      else if (node.nodeName === 'ARTICLE') {
        if (node.classList.contains('post')) {
          nodelist.push($(Parser.postbody, node));
        }
      }
      if (nodelist.length > 0) {
        Main.process(nodelist);
      }
    },
    observer: function (m) {
      var nodelist = [];

      m.forEach(function (e) {
        var nodes, node, menu, conflink, i, ii;

        if (e.addedNodes) {
          nodes = e.addedNodes;
          for (i = 0, ii = nodes.length; i < ii; ++i) {
            node = nodes[i];
            if (node.nodeName === 'DIV') {
              if (node.classList.contains('postContainer') || node.classList.contains('inline')) {
                nodelist.push($(Parser.postbody, node));
              }
              else if (node.classList.contains('thread')) { // support 4chan's new index pages
                nodelist = nodelist.concat($$(Parser.postbody, node));
              }
            }
            else if (node.nodeName === 'ARTICLE') {
              if (node.classList.contains('post')) {
                nodelist.push($(Parser.postbody, node));
              }
            }
          }
        }

        // 4chan X specific hacks.
        if (Main["4chanX3"]) {
          // detect when source links are added.
          if (e.target.classList.contains("fileText")) {
            if (
              e.previousSibling &&
              e.previousSibling.classList &&
              e.previousSibling.classList.contains("file-info")
            ) {
              node = e.target;
              while (node) {
                if (
                  node.classList.contains("postContainer") ||
                  node.classList.contains("inline")
                ) {
                  break;
                }
                node = node.parentNode;
                if (node.nodeName === 'BODY') {
                  node = null;
                  break;
                }
              }
              if (node) nodelist.push($(Parser.postbody, node));
            }
          }
        }

        // Detect 4chan X's linkification muck-ups
        if (e.addedNodes.length > 0) {
          nodes = e.addedNodes;
          for (i = 0, ii = nodes.length; i < ii; ++i) {
            node = nodes[i];
            if (node.nodeName === 'A' && node.classList.contains('linkified')) {
              if (
                node.innerHTML.match(regex.url) &&
                node.previousSibling.classList.contains('exbutton')
              ) {
                node.className = "exlink exgallery exunprocessed";
                $.remove(node.previousSibling);
                while (node) {
                  if (
                    node.classList.contains("postContainer") ||
                    node.classList.contains("inline")
                  ) {
                    break;
                  }
                  node = node.parentNode;
                  if (node.nodeName === 'BODY') {
                    node = null;
                    break;
                  }
                }
                if (node) nodelist.push($(Parser.postbody, node));
              }
            }
          }
        }

        // Add menu button back in whenever the menu is opened.
        if (
          e.addedNodes.length &&
          e.addedNodes[0].id === "menu" &&
          e.addedNodes[0].parentNode.parentNode.parentNode.parentNode.id === "header-bar"
        ) {
          menu = e.addedNodes[0];
          conflink = $.create('a', {
            className: 'exlinksOptionsLink entry',
            textContent: "ExLinks Settings"
          });
          $.on(conflink, 'click', function () {
            $.remove(menu);
            Options.open();
          });
          $.on(conflink, 'mouseover', function () {
            var entries = $$('.entry', menu),
              i, ii;
            for (i = 0, ii = entries.length; i < ii; ++i) {
              entries[i].classList.remove('focused');
            }
            conflink.classList.add("focused");
          });
          $.on(conflink, 'mouseout', function () {
            conflink.classList.remove("focused");
          });
          conflink.style.order = 112;
          $.add(e.addedNodes[0], conflink);
        }
      });

      if (nodelist.length > 0) Main.process(nodelist);
    },
    ready: function () {
      var nodelist = $$(Parser.postbody),
        MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,
        updater, css, font, style;

      Debug.timer.start('init');
      Config.site();
      Options.init();

      css = '';
      font = $.create('link', {
        rel: "stylesheet",
        type: "text/css",
        href: "//fonts.googleapis.com/css?family=Source+Sans+Pro:900"
      });
      style = $.create('link', {
        rel: "stylesheet",
        type: "text/css",
        href: css
      });
      $.add(d.head, font);
      $.add(d.head, style);
      Theme.prepare();
      Debug.log('Initialization complete. Time: ' + Debug.timer.stop('init'));

      Main.process(nodelist);

      if (MutationObserver) {
        updater = new MutationObserver(Main.observer);
        updater.observe(d.body, { childList: true, subtree: true });
      }
      else {
        $.on(d.body, 'DOMNodeInserted', Main.dom);
      }
      $.off(d, 'DOMContentLoaded', Main.ready);
    },
    init: function () {
      Config.init();
      Debug.init();
      Cache.init();
      Database.init();
      API.init();
      UI.init();
      $.extend(Main.queue, {
        list: {},
        add: function (uid) {
          Main.queue.list[uid] = true;
        },
        clear: function () {
          Main.queue.list = {};
        }
      });
      $.on(d, 'DOMContentLoaded', Main.ready);
    }
  };

  Main.init();

})();