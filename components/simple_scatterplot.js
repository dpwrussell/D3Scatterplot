/*jslint browser:true,
         nomen:true,
         white:true,
         vars:true,
         maxerr:1000,
         maxlen:80
*/

// BLK
// (function () {
// }());

(function ($) {
  'use strict';
  /*global window,document,console,debugger,jQuery,d3,Error,Math */

  var FIRST_COORD = 'x',
      SENTINEL = String.fromCharCode(29),
      NODATA,
      TYPE2MARKER;

  function assert (bool, info) {
    if (bool) { return; }
    var msg = 'assertion failed';
    if (arguments.length > 1) {
      msg += ': ' + info;
    }
    throw new Error(msg);
  }

  function is_numeric (s) {
    return !isNaN(parseFloat(s)) && isFinite(s);
  }

  function mkobj(arr) {
    var o = {};
    arr.forEach(function (v) {
      o[v[0]] = v[1];
    });
    return o;
  }

  function named_array (pairs) {
    var ret = pairs.map(function (p) { return p[1]; }),
        keys = pairs.map(function (p) { return p[0]; }),
        values = ret.slice(0),
        k2i = {};

    function set_key(k, v) {
      assert(!is_numeric(k) &&
             !ret.hasOwnProperty(k) &&
             ret[k] === undefined,
             'invalid key: ' + k);
      ret[k] = v;
    }

    keys.forEach(function (k, i) {
      set_key(k, ret[i]);
      k2i[k] = i;
    });

    set_key('keys_', keys);
    set_key('values', values);
    set_key('index', function (k) { return k2i[k]; });
    set_key('pairs', function () { return d3.zip(keys, values); });

    return ret;
  }

  var current_color;

  (function () {
    var mult = 360,
        start = 2/3,
        step = Math.sqrt(5) - 2;

    var index = 0;
    current_color = function () {
      return d3.hsl(mult * ((start + index * step) % 1), 0.6, 0.6).toString();
    };
    current_color.reset = function () { index = 0; };
    current_color.next = function () { index += 1; };
    current_color.prev = function () { index -= 1; };
  }());

  function translate (xy) {
    if (arguments.length === 2) {
      xy = Array.prototype.slice.call(arguments, 0);
    }
    return 'translate(' + xy.join(', ') + ')';
  }

  function viewbox (xywh) {
    if (arguments.length === 4) {
      xywh = Array.prototype.slice.call(arguments, 0);
    }
    return xywh.join(' ');
  }

  function flatten_nest(nest) {
    function _f (nest) {
      var values = nest.values;
      if (values.every) {
        if (values.every(function (v) { return v.hasOwnProperty('values'); })) {
          return Array.prototype.concat.apply([], values.map(_f));
        }
        return values;
      }
      return [values];
    }
    return _f({values: nest});
  }

  function get (key) {
    return function (d) { return d[key]; };
  }

  function unstack(data, keycols, pivcol, valcol, othercols) {
    var cokeycols = d3.merge([keycols, othercols]),
        ckc_set = d3.set(cokeycols),
        chk = function (v) {
          assert(!ckc_set.has(v));
          return v;
        },
        nest = d3.nest()
                 .rollup(function (d) {
                    var o = {}, d0 = d[0];
                    cokeycols.forEach(function (c) { o[c] = d0[c]; });
                    if (valcol !== undefined) {
                      d.forEach(function (e) { o[chk(e[pivcol])] = e[valcol]; });
                    }
                    else {
                      d.forEach(function (e) { o[chk(e[pivcol])] = null; });
                    }
                    return o;
                  });
    keycols.forEach(function (k) { nest.key(get(k)); });
    return flatten_nest(nest.entries(data));
  }

  function getn (keys) {
    return function (d) { return keys.map(function (k) { return d[k]; }); };
  }

  function proj (aoo, key) {
    return aoo.map(get(key));
  }

  function projn (aoo, keys) {
    return aoo.map(getn(keys));
  }

  function unique (array) {
    var seen = {}, unique_elements = [];

    array.forEach( function (item) {
       if ( seen.hasOwnProperty( item ) ) { return; }
       unique_elements.push( item );
       seen[ item ] = null;
    } );

    return unique_elements;
  }

  function toobjs (aoa, keys) {
    return aoa.map(function (a) {
      var ret = {};
      keys.forEach(function (k, i) { ret[k] = a[i]; });
      return ret;
    });
  }

  function xys (pair, data, keycols) {
    var _
    ,   from = d3.merge([pair, keycols])
    ,   keys = pair.length === 1 ? ['x'] : ['x', 'y']
    ,   to = d3.merge([keys, keycols])
    ;

    return toobjs(projn(data, from), to)
  }

  function interpolate(interval, t) {
    return interval[0] * (1 - t) + interval[1] * t;
  }

  function pad_interval(interval, padding) {
    return [interpolate(interval, -padding),
            interpolate(interval, 1 + padding)];
  }

  function clear_text_selection () {
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    else if (document.selection) {
      document.selection.empty();
    }
  }

  // ---------------------------------------------------------------------------
  // debugging utils

  function logjson (o) {
    console.log(JSON.stringify(o));
  }

  var time = (function () {
    var start,
        ret     = function () { return new Date().valueOf(); };
    ret.started = function () { return start; };
    ret.elapsed = function () { return ret() - start; };
    ret.reset   = function () { start = ret();
                                return start; };
    ret.reset();
    return ret;
  }());

  // ---------------------------------------------------------------------------


  function make_plot (__width, __height) {
    var $$ = {};

    var $SVG;

    function setup (WIDTH, HEIGHT) {

       var borderwidth = 0;//30;
       var outerwidth = WIDTH + borderwidth,
           outerheight = HEIGHT + borderwidth;

       var svg = d3.select('.stage')
                 .append('svg')
                   .attr('width', outerwidth)
                   .attr('height', outerheight)
                   .attr('viewBox', viewbox([-borderwidth/2, -borderwidth/2,
                                             outerwidth, outerheight]));
       $SVG = svg;

       // ----------------------------------------------------------------------
       var root = svg.append('g')
                   .attr('class', 'root');

       root.append('rect')
             .attr('width', WIDTH)
             .attr('height', HEIGHT)
             .style({fill: 'white',
                     stroke: '#999',
                     'stroke-width': borderwidth});

       // recover WIDTH and HEIGHT with
       // parseInt(d3.select('.stage .root > rect').attr('width'), 10)
       // parseInt(d3.select('.stage .root > rect').attr('height'), 10)

    } // function setup (WIDTH, HEIGHT)

    setup(__width, __height);

    function append_tspan ($parent, spec) {
      $parent.append('tspan')
             .attr(spec.attr)
             .text(spec.text);
    }

    // draw plot area
    (function () {
       var outerrect = $SVG.select('.root > rect');
       var WIDTH = parseInt(outerrect.attr('width'), 10);
       var HEIGHT = parseInt(outerrect.attr('height'), 10);

       var borderwidth = 0;//4;
       var rw = WIDTH - borderwidth/2;

       var available_width = rw;
       var voodoo = 0;
       var margin = 0;//10;
       var dx = (rw - available_width) + margin + voodoo;

       var root = $SVG.select('.root');
       var plot_g = root.append('g')
                          .attr('class', 'plot')
                          .attr('transform',
                                translate([dx, borderwidth/2]));

       var side = rw - dx;

       plot_g.append('rect')
               .attr('class', 'canvas')
               .attr('width', side)
               .attr('height', side)
               .style({'stroke-width': borderwidth});

       //var outerbw = parseInt(outerrect.style('stroke-width'), 10);
       var dh = side + borderwidth - HEIGHT;
       if (dh > 0) {
         var svg = $SVG;
         var vb = svg.attr('viewBox')
                     .split(' ')
                     .map(function (s) { return parseInt(s, 10); });
         vb[3] += dh;
         svg.attr({height: vb[3], viewBox: viewbox(vb)});
         outerrect.attr('height', HEIGHT + dh);
       }
    }());

    // -------------------------------------------------------------------------

    (function () {
       var padding = {top: 5, right: 1, bottom: 25, left: 29},
           plot_g = $SVG.select('.stage .plot')
                      .append('g')
                        .attr('class', 'plot-region')
                        .attr('transform',
                              translate(padding.left, padding.top));

       var canvas = $SVG.select('.plot .canvas'),
           width = parseInt(canvas.attr('width'), 10)
                   - (padding.left + padding.right),
           height = parseInt(canvas.attr('height'), 10)
                   - (padding.top + padding.bottom);

       plot_g.append('rect')
               .attr('class', 'frame')
               .attr('width', width)
               .attr('height', height);

       var _
       ,   x_scaler = d3.scale.linear().range([0, width])
       ,   y_scaler = d3.scale.linear().range([height, 0])
       ;

       var xaxis_g = plot_g.append('g')
                             .attr('class', 'x axis')
                             .attr('transform', 'translate(0,' + height + ')');

       var yaxis_g = plot_g.append('g')
                             .attr('class', 'y axis');

       var size = Math.min(width, height);
       plot_g.append('path')
               .attr('class', 'diagonal')
               .attr('d', 'M0,' + size + 'L' + size + ',0');

       var points_g = plot_g.append('g')
                              .attr('class', 'points');

       var PLOT_RANGE_PADDING,
           EDGE_PARAM,
           MARKER = {},
           CIRC,
           TRI,
           SQR,
           HBAR,
           VBAR;

       (function () {
          assert(width === height);
          var side = width,
              margin = 3.5,
              halfwidth = 3.5,
              radius = 5.5,
              abs_padding = 2 * margin + 2 * halfwidth + radius,
              rel_padding = abs_padding/(side - 2 * abs_padding),
              plot_label = plot_g.append('g')
                                   .attr('transform',
                                         translate(abs_padding, 0))
                                 .append('text')
                                 .append('tspan')
                                   .attr('class', 'plot-label')
                                   .attr('dy', '2ex');

          // __label.forEach(function (t) { append_tspan(plot_label, t); });

          PLOT_RANGE_PADDING = rel_padding;
          EDGE_PARAM = (margin + halfwidth)/abs_padding;

          MARKER.CIRC = d3.svg.symbol().type('circle')
                  .size(radius*radius*Math.PI)();
          MARKER.TRI = d3.svg.symbol().type('triangle-up')
                  .size(2*radius*radius)();
          MARKER.SQR = d3.svg.symbol().type('square')
                   .size(radius*radius*Math.PI)();

          function rect (hw, hh) {
            var o = (-hw + ',' + -hh);
            return 'M' + o + 'H' + hw + 'V' + hh + 'H' + -hw + 'Z';
          }

          HBAR = rect(halfwidth, 0.5);
          VBAR = rect(0.5, halfwidth);
       }());

       var xcoord,
           ycoord;

       $$.domain = function (domain) {
           var dmn = pad_interval(domain, PLOT_RANGE_PADDING);
           x_scaler.domain(dmn);
           y_scaler.domain(dmn);

           var edge_coord = (domain[0] * EDGE_PARAM) +
                            (dmn[0]    * (1 - EDGE_PARAM));

           xcoord = ycoord = function (v) {
             return isFinite(v) ? v : edge_coord;
           };

           var xaxis = d3.svg.axis()
               .scale(x_scaler)
               .orient('bottom')
               .ticks(4);

           var yaxis = d3.svg.axis()
               .scale(y_scaler)
               .orient('left')
               .ticks(4);

           xaxis_g.call(xaxis);
           yaxis_g.call(yaxis);

           return $$;
         };

       $$.fix_current =
         function () {
           points_g.selectAll('g:not(.fixed)')
                   .classed('fixed', true);
           $('#clear button').prop('disabled', false);
         };


       $$.release_last =
         function () {
           var id = d3.select('#legend li:last-child .entry')
                      .datum()
                      .join(SENTINEL);
           points_g.selectAll('.scatterplot-marker')
                   .filter(function (d) { return d.__id === id; })
                   .classed('fixed', false);
         };

       $$.view_data =
         function (data) {

           var have_one_coord = 1
           ,   color = current_color()
           ,   points = points_g.selectAll('g:not(.fixed)')
                                .data(data)
           ,   enter = points.enter()
           ,   exit = points.exit()
           ;

           enter
                 .append('g')
                   .attr('class', 'scatterplot-marker')
                   .each(function (datum) {
                      var $this = d3.select(this);

                      var $marker = $this.append('path')
                                         .attr({'class': 'marker'});
                      $marker.append('svg:title');
                    });

           exit.remove();

           points_g.selectAll('g:not(.fixed)')
                   .attr('transform', function (datum) {
                            return translate(d3.round(x_scaler(datum.x), 1),
                                             d3.round(y_scaler(datum.y), 1));
                         })
                   .attr({fill: color, stroke: color})
                   .each(function (datum) {
                       var $this = d3.select(this);

                       $this.select('path')
                            .attr({d: MARKER[TYPE2MARKER[datum.type]]});

                       $this.select('title')
                            .datum(datum['cell line'] + ' ' + datum.type)
                            .text(String);
                    });

            return $$;
         };

       $$.clear_all = function () {
           points_g.selectAll('g')
                 .data([])
               .exit()
               .remove();
           current_color.reset();
           return $$;
         };

       $$.clear_not_fixed = function () {
           points_g.selectAll('g:not(.fixed)')
                 .data([])
               .exit()
               .remove();
           return $$;
         };
    }());

    return $$;
  } // function make_plot () {


  // ---------------------------------------------------------------------------

  function app (DATA) {

    var $$ = {};

    // -------------------------------------------------------------------------

    function get_levels(factor) {
      return d3.set(proj(DATA, factor)).values().sort(function (a, b) {
               return a.toLowerCase().localeCompare(b.toLowerCase());
             });
    }

    // var METRIC = 'basal level';

    // DATA.forEach(function (r) { r[METRIC] = +r[METRIC]; });

    var _
    // ,   FACTORS = named_array(['target', 'cell line'].map(function (f) {
    //         return [f, get_levels(f)];
    //     }))
    // ,   KEYCOL
    //     // WARNING: hard-coding COKEYCOLS to meet the latest deadline,
    //     // and making this mess even worse...
    // ,   COKEYCOLS = ['cell line', 'type']
    ,   ww = $('#widget').width()
    ,   lpw = $('#left-panel').width()
    ,   side = ww - lpw
    ;

    $('#widget').width(ww);
    $('.stage').width(side);

    var PLOT = make_plot(side, side);
    PLOT.__data = DATA;
    PLOT.domain([-3, 3]);

    TYPE2MARKER = mkobj(d3.zip(get_levels('type'), ['TRI', 'SQR', 'CIRC']));

    $('#picker ul').hover(function (e) {
        if (e.shiftKey) { return; }
        PLOT.clear_not_fixed();
    });

    function toxys (levels, data) {
      var ret = xys(levels, data, COKEYCOLS);
      ret.forEach(function (d) {
        d.title = d[KEYCOL];
        d.levels = levels;
        d.__id = levels.join(SENTINEL);
        delete d[KEYCOL];
      });
      return ret;
    }

    function get_data_for (level) {
      debugger;

      var levels = [level];
      var picked = d3.selectAll('.first-coord');
      if (picked[0].length === 1) {
          levels.unshift(picked.datum().text);
      }

      var data = toxys(levels, PLOT.__data);
      if (picked[0].length === 1) {
          debugger;
      }
      return data;
    }

    function fix_current () {
      PLOT.fix_current();
    }

    function release_last () {
      PLOT.release_last();
    }

    function legend_label (pair) {
      return 'x: ' + pair[0] + '; y: ' + pair[1];
    }

    // ------------------------------------------------------------------------
    // handlers

    function _hover_on (e) {
        e.stopPropagation();

        $(this).css({outline: '1px solid black'});
        var data = d3.select(this).datum().__data;
        PLOT.view_data(data);
    }

    function _hover_off (_) {
        $(this).css({outline: 'none'});
    }

    function _click (e) {
        e.stopPropagation();

        clear_text_selection();
        fix_current();

        $(this).css({color: 'white',
                     'background-color': current_color(),
                     opacity: 1,
                     filter: 'alpha(opacity=100)'});

        current_color.next();
    }

    function handlers () {
      $(this).hover(_hover_on, _hover_off)
             .click(_click)
    }

    // ------------------------------------------------------------------------

    function clear_all () {
      PLOT.clear_all();
      $('#clear button').prop('disabled', true);
    }

    function _extract_data (keycol, pivcol, valcol, othercols) {
      if (arguments.length === 3) {
          othercols = [];
      }
      assert(FACTORS.keys_.indexOf(keycol) > -1);
      assert(keycol !== pivcol);
      var unstacked = unstack(DATA, [keycol],
                              pivcol, valcol, othercols);

      return flatten_nest(d3.nest()
                            .key(get(keycol))
                            .entries(unstacked));
    }

    (function () {
        PLOT.clear_all();
    }());

    (function () {
      var _
      ,   levels = unique(proj(DATA, 'experiment'))
      ,   list = d3.select('#picker ul')
      ,   ncols = 3
      ,   min_rows = 3
      ,   data
      ;

      function select(experiment) {
          return DATA.filter(function (e) {
              return e.experiment == experiment;
          })
      }

      data = levels.map(function (level) {
          return {text: level, __data: select(level)};
      });

      function chunk (array, chunksize) {
        return d3.range(array.length/chunksize)
                 .map(function (i) {
                    var s = i * chunksize;
                    return array.slice(s, s + chunksize);
                  });
      }

      function pad_array (array, n) {
        return array.concat(d3.range(n - array.length)
                              .map(function () { return SENTINEL; }));
      }

      function columnate (array, ncols) {
        var nrows = Math.max(min_rows, Math.ceil(array.length/ncols));
        return d3.merge(d3.transpose(chunk(pad_array(array, nrows * ncols), nrows)));
      }

      list.selectAll('li')
          .data(columnate(data, ncols))
          .each(handlers);

    }());

    $('#clear button').click(function (e) {
        if (e.which !== 1) { return; }
        clear_all();
    });

    // -------------------------------------------------------------------------

    return $$;
  } // function app (DATA) {


  // ---------------------------------------------------------------------------

  (function () {
     d3.tsv('./data.tsv', function (error, data) {
       assert(error === null);
       app(data);

       $('.loading').css('visibility', 'visible')
                    .removeClass('loading');
     });
  }());

}(jQuery));
