var chart;
var api_key = '027ER5TKTSQ81BANR';
var en = new EchoNest(api_key);

var curArtist = '';
var curSongs = null;
var curSongIndex;
var autoStop = false;

var allSongs = [];
var requests = 0;
var params = { };

var charts = [
    {
        key: 'energy',
        range: {
            auto: false,
            scale: 100,
            bins: 10,
            low: 0,
            high: 1
        },
        get: function(song) {
            return song.audio_summary.energy;
        },

        nget: function(song) {
            return song.audio_summary.energy;
        },
    },
    {
        key: 'loudness',
        range: {
            auto: true,
            scale: 1,
            bins: 10,
            low: -60,
            high: 0
        },
        get: function(song) {
            return song.audio_summary.loudness;
        },
        nget: function(song) {
            return song.audio_summary.normalized_loudness;
        },
    },
    {
        key: 'danceability',
        range: {
            auto: false,
            scale: 100,
            bins: 10,
            low:  0,
            high: 1
        },
        get: function(song) {
            return song.audio_summary.danceability;
        },
        nget: function(song) {
            return song.audio_summary.danceability;
        },
    },
    {
        key: 'liveness',
        range: {
            auto: false,
            scale: 100,
            bins: 10,
            low:  0,
            high: 1
        },
        get: function(song) {
            return song.audio_summary.liveness;
        },
        nget: function(song) {
            return song.audio_summary.liveness;
        },
    },
    {
        key: 'speechiness',
        range: {
            auto: false,
            scale: 100,
            bins: 10,
            low:  0,
            high: 1
        },
        get: function(song) {
            return song.audio_summary.speechiness;
        },
        nget: function(song) {
            return song.audio_summary.speechiness;
        },
    },
    {
        key: 'hotttnesss',
        range: {
            auto: false,
            scale: 100,
            bins: 10,
            low:  0,
            high: 1
        },
        get: function(song) {
            return song.song_hotttnesss;
        },
        nget: function(song) {
            return song.song_hotttnesss;
        },
    },
    {
        key: 'tempo',
        range: {
            auto: true,
            scale: 1,
            bins: 10
        },
        get: function(song) {
            return song.audio_summary.tempo;
        },

        nget: function(song) {
            return song.audio_summary.normalized_tempo;
        },
    },

    {
        key: 'duration',
        range: {
            auto: true,
            scale: 1,
            bins: 10
        },
        get: function(song) {
            return song.audio_summary.duration;
        },
        nget: function(song) {
            return song.audio_summary.normalized_duration;
        },
    },

    {
        key: 'key',
        range: {
            auto: false,
            low:  0,
            high: 12,
            scale: 1,
            bins: 12
        },
        get: function(song) {
            return song.audio_summary.key;
        },

        getLabel: function(label) {
            var notes = {
                0 : 'C',
                1 : 'C#',
                2 : 'D',
                3 : 'D#',
                4 : 'E',
                5 : 'F',
                e : 'F#',
                7 : 'G',
                8 : 'G#',
                9 : 'A',
                10 : 'A#',
                11 : 'B',
            }
            if (label in notes) {
                return notes[label];
            } else {
                return label;
            }
        }
    },

    {
        key: 'time sig',
        range: {
            auto: false,
            low:  0,
            high: 8,
            scale: 1,
            bins: 8 
        },
        get: function(song) {
            return song.audio_summary.time_signature;
        },
    },
    {
        key: 'mode',
        range: {
            auto: false,
            low:  0,
            high: 2,
            scale: 1,
            bins: 2
        },
        get: function(song) {
            return song.audio_summary.mode;
        },

        getLabel: function(label) {
            var mode = {
                0 : 'major',
                1 : 'minor',
            }

            if (label in mode) {
                return mode[label];
            } else {
                return label;
            }
        }
    },
];

function showBarChart(chartInfo) {
    var hist = createHistogram(chartInfo);
    // SERIAL CHART
    chart = new AmCharts.AmSerialChart();
    chart.dataProvider = hist
    chart.categoryField = "category";
    chart.startDuration = 1;
    chart.marginTop = 40;

    // AXES
    // category
    var categoryAxis = chart.categoryAxis;
    categoryAxis.labelRotation = 90;
    categoryAxis.labelRotation = 00;
    categoryAxis.gridPosition = "start";

    // value
    // in case you don't want to change default settings of value axis,
    // you don't need to create it, as one value axis is created automatically.

    var valueAxis = new AmCharts.ValueAxis();
    valueAxis.title = "Number of Songs";
    chart.addValueAxis(valueAxis);

    // GRAPH
    var graph = new AmCharts.AmGraph();
    graph.valueField = "val";
    graph.balloonText = "[[category]]: [[value]] songs";
    graph.type = "column";
    graph.lineAlpha = 0;
    graph.fillAlphas = 0.8;

    chart.addTitle(toTitleCase(chartInfo.key) + " distribution for " + curArtist, 20, "#333", true)
    chart.addGraph(graph);

    chart.addListener("rollOverGraphItem", function(evt) {
    });

    chart.addListener("clickGraphItem", function(evt) {
        startPlayingSongs(hist[evt.index].songs);
    });
    chart.write("chartdiv");
}

// a cold to hot color pallet
var pallet = [
    color(41, 10, 216),
    color(38, 77, 255),
    color(63, 160, 255),
    color(114, 217, 255),
    color(170, 247, 255),
    color(224, 255, 255),
    color(255, 255, 191),
    color(255, 224, 153),
    color(255, 173, 114),
    color(247, 109, 94),
    color(216, 38, 50),
    color(165, 0, 33),
    color(165, 0, 33),
];

var pallet2 = [
    color(0, 0, 128),
    color(0, 64, 64),
    color(0, 128, 0),
    color(64, 64, 0),
    color(168, 0, 0),
    color(168, 0, 0),
    color(168, 0, 0),
];


function color(r, g, b) {
    function hc(c) {
        c = Math.round(c * 1);
        var cs = c.toString(16);
        if (cs.length == 1) {
            return '0' + cs;
        } else {
            return cs;
        }
    }
    return "#" + hc(r) + hc(g) + hc(b);
}

function getColor(val) {
    var cpallet = pallet2;
    var index = Math.round(val * (cpallet.length - 1));
    return cpallet[index];
}

function normalizeSongAttribute(attribute) {
    var min = 1000000;
    var max = -1000000;

    $.each(allSongs, function(index, song) {
        var val = song.audio_summary[attribute];
        if (val  > max) {
            max = val;
        }
        if (val  < max) {
            min = val;
        }
    });

    var range = max - min;
    $.each(allSongs, function(index, song) {
        var val = song.audio_summary[attribute];
        var nval = (val - min) / range;
        song.audio_summary['normalized_' + attribute] = nval;
    });
}


function getSongData(chartX, chartY, chartZ, chartW) {
    var data = [];
    var minSize = 3;
    var sizeRange = 12;

    function get(chart, song) {
        return chart.get(song) * chart.range.scale;
    }

    $.each(allSongs, function(index, song) {
        var d = {
            x : get(chartX, song),
            y : get(chartY, song),
            z : chartZ.nget(song) * sizeRange + minSize,
            color : getColor(chartW.nget(song)),
            title : song.title,
            song: song
        };
        data.push(d);
    });
    return data;
}

function updateScatterChart() {
    var chartX = $("#x-attribute-select :selected").val();
    var cx = charts[chartX];

    var chartY = $("#y-attribute-select :selected").val();
    var cy = charts[chartY];

    var chartZ = $("#z-attribute-select :selected").val();
    var cz = charts[chartZ];

    var chartW = $("#w-attribute-select :selected").val();
    var cw = charts[chartW];

    addURL('x', cx.key);
    addURL('y', cy.key);
    addURL('z', cz.key);
    addURL('w', cw.key);
    addURL('type', 'scatter');
    clrURL(['d']);
    makeURL();

    // SERIAL CHART
    var dataProvider = getSongData(cx, cy, cz, cw);
    chart = new AmCharts.AmXYChart();
    chart.dataProvider = dataProvider;
    chart.startDuration = 0;
    chart.startEffect = 'elastic';
    chart.sequencedAnimation = false;
    chart.marginTop = 40;
    chart.pathToImages ="amcharts/images/";

    // AXES
    // category
    var xAxis = new AmCharts.ValueAxis();
    xAxis.position = "bottom";
    xAxis.axisAlpha = 0;
    xAxis.autoGridCount = true;
    xAxis.title = cx.key;
    chart.addValueAxis(xAxis);

    var yAxis = new AmCharts.ValueAxis();
    yAxis.position = "left";
    yAxis.axisAlpha = 0;
    yAxis.autoGridCount = true;
    yAxis.title = cy.key;
    chart.addValueAxis(yAxis);


    // GRAPH
    var graph = new AmCharts.AmGraph();
    graph.valueField = "val";
    graph.balloonText = "[[title]]";
    graph.xField = 'x';
    graph.yField = 'y';
    graph.colorField = 'color';
    graph.lineAlpha = 0;
    graph.bullet = 'round';
    graph.bulletSizeField = 'z';
    // graph.descriptionField = 'title';

    chart.addTitle("Scatter plot for " + curArtist, 20, "#333", true)
        // CURSOR
    var chartCursor = new AmCharts.ChartCursor();
    chart.addChartCursor(chartCursor);

    // SCROLLBAR
    var chartScrollbar = new AmCharts.ChartScrollbar();
    chart.addChartScrollbar(chartScrollbar);

    chart.addGraph(graph);

    chart.addListener("rollOverGraphItem", function(evt) {
    });

    chart.addListener("clickGraphItem", function(evt) {
        var song = dataProvider[evt.index].song;
        playSong(song);
    });

    chart.write("schartdiv");
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}



function initUI() {
    $("#pause-play").click(function() {
        R.player.togglePause();
    });

    $("#play-next").click(function() {
        playNextSong();
    });

    $(window).resize(function() {
        resizeChart();
    });

    $("#artist-input").change(function() {
        var  artist = $("#artist-input").val();
        fetchAllSongsForArtist(artist);
    });

    $(".attribute-select").empty();
    $.each(charts, function(index, chart) {
        var choice = $("<option>");
        choice.attr('value', index);
        choice.text(chart.key);
        $(".attribute-select").append(choice);
    }); 

    $('#x-attribute-select option[value=0]').attr("selected",true);
    $('#y-attribute-select option[value=1]').attr("selected",true);
    $('#z-attribute-select option[value=5]').attr("selected",true);
    $('#w-attribute-select option[value=3]').attr("selected",true);


    $(".attribute-select").change(function() {
        updateCharts();
    });


    $("#show-main").click(function() {
        makeDistributionChartActive();
    });

    $("#show-about").click(function() {
        $(".nav-choice").removeClass("active");
        $("#show-about").parent().addClass("active");
        $(".main-display").hide();
        $("#about").show();
    });

    $("#show-scatter").click(function() {
        makeScatterChartActive();
    });

    resizeChart();
}

function makeScatterChartActive() {
    $(".nav-choice").removeClass("active");
    $("#show-scatter").parent().addClass("active");
    $(".main-display").hide();
    $("#scatter-display").show();
    updateScatterChart();
}

function makeDistributionChartActive() {
    $(".nav-choice").removeClass("active");
    $("#show-main").parent().addClass("active");
    $(".main-display").hide();
    $("#main").show();
    updateDistributionChart();
}

function resizeChart() {
    var width = $("#sim-tab").width();
    var height = $("#sim-tab").height();

    if (height > 800) {
        height = 800;
    }
    $("#simgraph").attr("width", width);
    $("#simgraph").attr("height", height);
}

function info(s) {
    if (s.length > 0) {
        //$("#info").show();
        $("#info").text(s);
    } else {
        $("#info").text("");
        //$("#info").hide();
    }
}

function getRdioID(song) {
    var id = song.tracks[0].foreign_id;
    var rawID = id.split(':')[2]
    return rawID;
}

function playSong(song) {
    var rdioID = getRdioID(song);
    currentSong = song;
    R.player.play({
        source: rdioID
    });
    $("#song-title").text(song.title);
    $("#artist-name").text(song.artist_name);
    updateSongTables(song);
}

function queueSong(song) {
    autoStop = true;
    playSong(song);
}

function playNextSong() {
    $("#now-playing").show();
    if (curSongIndex >= curSongs.length) {
        curSongIndex = 0;
    }

    if (curSongIndex < curSongs.length) {
        playSong(curSongs[curSongIndex++]);
    }
}

function startPlayingSongs(songs) {
    if (curSongs != songs) {
        curSongIndex = 0;
        curSongs = songs;
    }
    playNextSong();
}


function fetchAllSongsForArtist(artistName) {
    fetchAllSongsForArtist2(artistName);
}

function fetchAllSongsForArtist1(artistName) {
    var slices = 4;
    var erange = 1. / slices;
    var start = 0;

    allSongs = [];
    requests = 0; // promises to keep

    info("Getting songs for " + artistName);
    for (var i = 0; i < slices; i++) {
        requests += 1
        fetchSongsForArtistByEnergy(artistName, start, start + erange);
        start += erange;
    }
}


function fetchAllSongsForArtist2(artistName) {
    en.apiRequest('artist/search', {name:artistName, results:1, bucket:['id:rdio-US'], limit:true}, 
        function(data) {
            if (data.response.artists.length > 0) {
                var artist = data.response.artists[0];
                info("Found " + artist.name);
                fetchSongsForArtist(artist.id, 0);
            } else {
                info("Can't find " + artistName);
            }
        },
        function() {
            info("Trouble finding music for " + artistName);
        }
    );
}

function fetchSongsForArtist(artistID, start) {
    var pageSize = 100;
    var args = {
        bucket: ['id:rdio-US', 'tracks', 'audio_summary', 'song_hotttnesss'],
        limit: true,
        artist_id: artistID,
        results: pageSize,
        start: start,
        sort: 'song_hotttnesss-desc'
    };

    if (start == 0) {
        allSongs = [];
    }

    en.apiRequest('song/search', args, 
        function(data) {

            $.each(data.response.songs, function(index, song) {
                curArtist = song.artist_name;
                allSongs.push(song);
                info("Found " + allSongs.length + " songs");
            });

            if (allSongs.length >= 1000 || data.response.songs.length < pageSize) {
                info("");
                addURL('artist', curArtist);
                normalizeSongs();
                curSongs = allSongs;
                curSongIndex = 0;
                updateCharts();
                if (!R.player.playState() == R.player.PLAYSTATE_PLAYING) {
                    queueHotSong();
                }
            } else {
                fetchSongsForArtist(artistID, start + pageSize);
            }
        },
        function() {
            info("Trouble finding music for " + artistName);
        }
    );
}




function createHistogram(chartInfo) {
    var vMax = -1000000;
    var vMin = 1000000;

    if (chartInfo.range.auto) {
        $.each(allSongs, function(index, song) {
            var val = chartInfo.get(song);
            if (val > vMax) {
                vMax = val;
            }
            if (val < vMin) {
                vMin = val;
            }
        });
    } else {
        vMin = chartInfo.range.low;
        vMax = chartInfo.range.high;
    }

    var range = (vMax - vMin);

    var hist = [];

    var doubleLabel = (chartInfo.range.bins - range) != 0;
    for (var i = 0; i < chartInfo.range.bins; i++) {
        var label = Math.round(chartInfo.range.scale * i / chartInfo.range.bins * range + vMin);
        if (doubleLabel)  {
            var hlabel = Math.round(chartInfo.range.scale * (i + 1) / chartInfo.range.bins * range + vMin);
            label =  label + ' - ' + hlabel;
        } 

        if (chartInfo.getLabel) {
            label = chartInfo.getLabel(label);
        }
        hist[i] = { category: label, val: 0, songs:[] };
    }

    $.each(allSongs, function(index, song) {
        var val = chartInfo.get(song);

        val = val > vMax ? vMax : val < vMin ? vMin : val;
        nval = (val - vMin) / range;
        var bin = Math.floor(nval * chartInfo.range.bins);
        bin = bin >= hist.length ? hist.length - 1 : bin < 0 ? 0 : bin;
        hist[bin].val += 1;
        hist[bin].songs.push(song);
    });

    return hist;
}

function updateCharts() {
    if ('type' in params && params.type == 'scatter') {
        updateScatterChart();
    } else {
        updateDistributionChart();
    }
}


function updateDistributionChart() {
    var whichChart = $("#attribute-select :selected").val();
    var chartInfo = charts[whichChart];

    addURL('type', 'bar');
    addURL('d', chartInfo.key);
    clrURL(['x', 'y', 'z', 'w']);
    makeURL();

    showBarChart(chartInfo);
}

function normalizeSongs() {
    normalizeSongAttribute('tempo');
    normalizeSongAttribute('loudness');
    normalizeSongAttribute('duration');
}


function updateSongTables(song) {
    var rowsPerTable = 6
    $(".stable").empty();


    function get(chart, song) {
        var val = chart.get(song);
        val = Math.round(val * chart.range.scale);

        if (chart.getLabel) {
            val = chart.getLabel(val);
        }
        return val;
    }

    $.each(charts, function(index, chart) {
        var which = Math.floor(index / rowsPerTable);
        var table = $('#stable-' + (which + 1));
        var tr = $("<tr>");
        var th = $("<th>");
        var td = $("<td>");

        th.text(chart.key);
        td.text(get(chart, song));

        tr.append(th);
        tr.append(td);
        table.append(tr);
    });
}

function queueHotSong() {
    var hotttest = allSongs[0];
    $.each(allSongs, function(index, song) {
        if (song.hotttnesss > hotttest.hotttnesss) {
            hotttest = song;
        }
    });
    queueSong(hotttest);
}

function fetchSongsForArtistByEnergy(artistName, minEnergy, maxEnergy) {
    var args = {
        type: 'artist',
        bucket: ['id:rdio-US', 'tracks', 'audio_summary', 'song_hotttnesss'],
        limit: true,
        artist: artistName,
        min_energy: minEnergy,
        max_energy: maxEnergy,
        results: 100
    };

    en.apiRequest("playlist/static", args,

    function(data) {
        if (data.response.songs.length == 0) {} else {
            curSongs = data.response.songs;
            $.each(data.response.songs, function(index, song) {
                curArtist = song.artist_name;
                allSongs.push(song);
                info("Found " + allSongs.length + " songs");
            });
        }

        if (--requests <= 0) {
            info("");
            addURL('artist', curArtist);
            normalizeSongs();
            updateCharts();
            if (!R.player.playState() == R.player.PLAYSTATE_PLAYING) {
                queueHotSong();
            }
        }
    },

    function error() {
        info("Sorry, trouble finding music for " + artistName);
    });
}


R.ready(function() {
    R.player.on("change:playingTrack", function(track) {
        if (track) {
            var image = track.attributes.icon;
            $("#album-art").attr('src', image);
        } else {
            playNextSong();
        }
    });

    R.player.on("change:playState", function(state) {
        if (state == R.player.PLAYSTATE_PAUSED) {
            $("#pause-play i").removeClass("icon-pause");
            $("#pause-play i").addClass("icon-play");
        }
        if (state == R.player.PLAYSTATE_PLAYING) {
            if (autoStop) {
                autoStop = false;
                R.player.pause();
            }
            $("#pause-play i").removeClass("icon-play");
            $("#pause-play i").addClass("icon-pause");
        }
    });

    R.player.on("change:playingSource", function(track) {});
});

function urldecode(str) {
   return decodeURIComponent((str+'').replace(/\+/g, '%20'));
}

function addURL(key, value) {
    params[key] = value;
}

function makeURL() {
    var p = ''
    $.each(params, function(key, val) {
        if (val != null) {
            if (p.length == 0) {
                p += '?';
            } else {
                p += '&';
            }
            p += key;
            p += '=';
            p += val
        }
    });
    history.replaceState({}, document.title, p);
}

function clrURL(keylist) {
    $.each(keylist, function(index, val) {
        if (val in params) {
            delete params[val];
        }
    });
}

function selectAttribute(select, attribute, params) {
    if (attribute in params) {
        var val = params[attribute];
        $(select + ' option:contains("' + val + '")').attr("selected",true);
    }
}

function processParams() {
    var q = document.URL.split('?')[1];
    if(q != undefined){
        q = q.split('&');
        for(var i = 0; i < q.length; i++){
            var pv = q[i].split('=');
            var p = pv[0];
            var v = pv[1];
            params[p] = urldecode(v);
        }
    }

    var artist = 'weezer';
    if ('artist' in params) {
        artist = params['artist'];
    } 

    selectAttribute("#attribute-select", 'd', params);
    selectAttribute("#x-attribute-select", 'x', params);
    selectAttribute("#y-attribute-select", 'y', params);
    selectAttribute("#z-attribute-select", 'z', params);
    selectAttribute("#w-attribute-select", 'w', params);

    if ('type' in params) {
        if (params['type'] == 'scatter') {
            makeScatterChartActive();
        }
    } 
    fetchAllSongsForArtist(artist);
}

$(document).ready(function() {
    initUI();
    AmCharts.ready( function() { processParams()});
});
