// ==UserScript==
// @name        H-links
// @namespace   dnsev-h
// @author      dnsev-h
// @version     1.0.2
// @description Userscript for pretty linkification of hentai links on 4chan and friends
// @include     http://boards.4chan.org/*
// @include     https://boards.4chan.org/*
// @include     http://boards.38chan.net/*
// @include     https://archive.moe/*
// @include     http://8ch.net/*
// @include     https://8ch.net/*
// @homepage    https://dnsev-h.github.io/h-links/
// @supportURL  https://github.com/dnsev-h/h-links/issues
// @updateURL   https://github.com/dnsev-h/h-links/raw/stable/h-links.meta.js
// @downloadURL https://github.com/dnsev-h/h-links/raw/stable/h-links.user.js
// @icon        data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABBElEQVR4Ae3Zg24FYRBH8b5obQW1bdt2+2AbZx7hNuyZ+ttcLf6T/MrFnBo1Gk3xU4ijitdUQPIDojcDigqI9g1bUEBogAK2DCvIfoACnlBUwIphHtkMUMCT4RYcE180Z5hC4HflAqCA5AbcGi6cY2fP2XRWnDlnEp/u9Wq4xKdj5g3D8MckK0AB54YjZ9fZdJbxZWmM4NO9rgy7zoIz7HQhqQEK+GXpIr+M9tsH9/KwpbudOiQ3QAG7hg0U9cNcr6ED/pj4SzPJClDAhmEJRQV0GJrhjvGClk5ugAKWDLMoKoClg5YLuFeCAxQwa5hAMQEs7cW5ZvIDFKB/MSkgtaPRaDTvICyvC8iXsp8AAAAASUVORK5CYII=
// @icon64      data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAABnRSTlMAAQAAAABTxi4hAAABH0lEQVR4Ae3aRVYkURBG4VcL7cYdJri7O42768JyGltgxLmBlAY09sf5ZiUZd5RSlXLpe1NAjALKn4/4UgUo4KsEZA8GJxKQbRpW8WsCFKCAVcM8vnyAAhRwg1DAvGEKXzJAAQq4MZwjBSabNIyihAu7vKMABXxYwLnhyNl1/jkrzrwz6Yzg2bHuDcd49p4pQx/ydMUDFKCAQ8OOs+GsOHN4sTT68exYJ4YNZ9rpc1qhAAV8VEC+pVNgsi578jyglKXbnL/4sAAFKGDDsIzQDU2HoRnJTblL56AABbxvwLJhFqGAZkMdUp4pYemPC1CAAmYNEwgFuKVLWS5yLAUoIBwwYRhGKICl8wcEKEAB+rOHAhSgfy0qQAEKUIACKvYIACct1/DsfqEAAAAASUVORK5CYII=
// @grant       GM_xmlhttpRequest
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @run-at      document-start
// ==/UserScript==