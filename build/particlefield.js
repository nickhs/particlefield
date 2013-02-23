var ParticleField = (function(options) {
  var particle = {
    vx: 0,
    vy: 0,
    x: 0,
    y: 0
  };

  var opts = {
    rows: 100,
    cols: 240,
    num_particles: null,
    spacing: 4,
    margin: 40,
    radius: Math.pow(50, 2),
    mouse: true,
    color: [0, 0, 0, 255]
  };

  var canvas;
  var ctx;
  var width;
  var height;
  var customAnim;

  var particles = [];
  var mx = 0;
  var my = 0;
  var alt = false;
  var manual = false;
  var running = false;

  setOptions(options);

  function draw(holder) {
    if (!holder) {
      throw "You need to specify a canvas element";
    }

    canvas = holder;
    opts.num_particles = (opts.rows * opts.cols);

    ctx = canvas.getContext('2d');

    width = canvas.width = opts.cols * opts.spacing + opts.margin * 2;
    height = canvas.height = opts.rows * opts.spacing + opts.margin * 2;

    for (var i = 0; i < opts.num_particles; i++) {
      var p = Object.create(particle);
      p.x = p.orig_x = opts.margin + opts.spacing * (i % opts.cols);
      p.y = p.orig_y = opts.margin + opts.spacing * Math.floor(i / opts.cols);
      particles[i] = p;
    }

    if (opts.mouse) {
      canvas.addEventListener('mousemove', function(e) {
        manual = true;
        var bounds = canvas.getBoundingClientRect();
        mx = e.clientX - bounds.left;
        my = e.clientY - bounds.top;
      });
    }

    frame();
  }

  function frame() {
    if (alt) {
      if (!manual) {
        var movement = animation();
        mx = movement.mx;
        my = movement.my;
      }

      for (var o = 0; o < opts.num_particles; o++) {
        var p = particles[o];

        // Determine distance travelled
        var dx = mx - p.x;
        var dy = my - p.y;
        var dist = (dx * dx) + (dy * dy);


        if (dist < opts.radius) {
          var tmp = Math.atan2(dy, dx);
          var f = -opts.radius / dist;

          p.vx += f * Math.cos(tmp);
          p.vy += f * Math.sin(tmp);
        }

        p.x += (p.vx *= .95) + (p.orig_x - p.x) * .25;
        p.y += (p.vy *= .95) + (p.orig_y - p.y) * .25;
      }

      alt = !alt;
    } else {
      var image = ctx.createImageData(width, height);
      for (var i = 0; i < opts.num_particles; i++) {
        var p = particles[i];
        var index = (Math.floor(p.x)  + (Math.floor(p.y) * width)) * 4;
        image.data[index] = opts.color[0];
        image.data[index+1] = opts.color[1];
        image.data[index+2] = opts.color[2];
        image.data[index+3] = opts.color[3];
      }

      ctx.putImageData(image, 0, 0);
      alt = !alt;
    }

    if (running)
      requestAnimationFrame(frame);
  }

  function animation() {
    if (customAnim) {
      return customAnim(mx, my, width, height, opts);
    }

    var time = Date.now() * 0.0015;
    mx = width * 0.5 + (0.4 * width * Math.cos(time))
    my = height * 0.5 + (0.6 * height * Math.cos(time) * Math.sin(time))
    return {mx: mx, my: my}
  }

  function getOptions() {
    return opts;
  }

  function setOptions(options) {
    console.log('here');
    for (var key in options) {
      opts[key] = options[key];
    }
  }

  function getMouseState() {
    return opts.mouse;
  }

  function setMouseState(state) {
    opts.mouse = state;
    return opts.mouse;
  }

  function start() {
    running = true;
    frame();
  }

  function stop() {
    running = false;
  }

  function setCustomAnimation(func) {
    customAnim = func;
  }

  return {
    draw: draw,
    start: start,
    stop: stop,
    getMouseState: getMouseState,
    setMouseState: setMouseState,
    getOptions: getOptions,
    setOptions: setOptions,
    setCustomAnimation: setCustomAnimation
  };
});

// RequestAnimationFrame shim taken from Opera
//     http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());