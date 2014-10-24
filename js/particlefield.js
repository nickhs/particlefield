/* exported ParticleField */

var ParticleField = (function(options) {

  /* Default options */
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

  // Variables used later internally
  var canvas;
  var ctx;
  var width;
  var height;
  var customAnim;

  // Contains state information
  // mx and my are the the current
  // location of the mouse pointer
  var mx = 0;
  var my = 0;

  // Determines if the animation should
  // be running or if the field should be
  // in "interactive"/mouse mode
  var manual = false;

  // Determines if the RAF is running
  // if false, all updates, either mouse
  // or function forced will pause
  var running = false;

  // Contains typed arrays with the current
  // state of every particle in the particle field
  // orig*_view contains the original, or rest state
  var origx_view;
  var origy_view;

  // *_view contains the current position
  // of every particle in the field
  var x_view;
  var y_view;

  // v*_view contains the velocity of every
  // particle in the system. Importantly used
  // for nicer easing effects
  var vx_view;
  var vy_view;

  // override any of the default options
  setOptions(options);

  /**
   * Helper function to build out all the typed arrays
   * The arrays contain the "original" view (where the particles
   * rest by default) as well was their current position and
   * velocity for easing.
   *
   * Set's up the variables listed above in the view section
   */
  function _createArrays() {
    origx_view = new Uint16Array(opts.num_particles * 2);
    origy_view = new Uint16Array(opts.num_particles * 2);
    x_view = new Float64Array(opts.num_particles * 8);
    y_view = new Float64Array(opts.num_particles * 8);
    vx_view = new Float64Array(opts.num_particles * 8);
    vy_view = new Float64Array(opts.num_particles * 8);
  }

  function draw(holder) {
    if (!holder) {
      throw 'You need to specify a canvas element';
    }

    canvas = holder;
    opts.num_particles = (opts.rows * opts.cols);

    ctx = canvas.getContext('2d');

    width = canvas.width = opts.cols * opts.spacing + opts.margin * 2;
    height = canvas.height = opts.rows * opts.spacing + opts.margin * 2;

    _createArrays();

    // Setup the position of each particle in the system
    for (var i = 0; i < opts.num_particles; i++) {
      x_view[i] = origx_view[i] = opts.margin + opts.spacing * (i % opts.cols);
      y_view[i] = origy_view[i] = opts.margin + opts.spacing * Math.floor(i / opts.cols);
    }

    // Add a mouse listener if we want one
    if (opts.mouse) {
      canvas.addEventListener('mousemove', function(e) {
        manual = true;
        var bounds = canvas.getBoundingClientRect();
        mx = e.clientX - bounds.left;
        my = e.clientY - bounds.top;
      });
    }

    // Kickoff the RequestAnimationFrame sequence
    frame();
  }

  // Called every 30s or 60s depending on the browser and RAF
  // Moves everything a "frame"
  function frame() {
    // Determine if displacement occurs due to
    // the animation function or mouse movement
    if (!manual) {
      var movement = animation();
      mx = movement.mx;
      my = movement.my;
    }

    for (var o = 0; o < opts.num_particles; o++) {
      // Determine distance travelled
      var dx = mx - x_view[o];
      var dy = my - y_view[o];
      var dist = (dx * dx) + (dy * dy);

      // If particle is displaced, calculate
      // movement back
      if (dist < opts.radius) {
        var tmp = Math.atan2(dy, dx);
        var f = -opts.radius / dist;

        vx_view[o] += f * Math.cos(tmp);
        vy_view[o] += f * Math.sin(tmp);
      }

      // Ease particle back
      x_view[o] += (vx_view[o] *= 0.95) + (origx_view[o] - x_view[o]) * 0.25;
      y_view[o] += (vy_view[o] *= 0.95) + (origy_view[o] - y_view[o]) * 0.25;
    }

    // Render an image on the canvas element in the browser
    // Note we use the ctx.data API here for improved performance
    // as we have to redraw all the particles anyway.
    //
    // A potential optimization woud be only determining the "affected" particles
    // and redrawing them.
    var image = ctx.createImageData(width, height);
    for (var i = 0; i < opts.num_particles; i++) {
      var index = (Math.floor(x_view[i])  + (Math.floor(y_view[i]) * width)) * 4;
      image.data[index] = opts.color[0];
      image.data[index+1] = opts.color[1];
      image.data[index+2] = opts.color[2];
      image.data[index+3] = opts.color[3];
    }

    ctx.putImageData(image, 0, 0);

    // Loop back to start according to RAF
    if (running)
      requestAnimationFrame(frame);
  }

  /**
   * Called every frame by frame() above.
   * Used when field is not in interactive mode
   * but is being animated by some sort of function
   *
   * If customAnim is not defined defaults to an
   * infinity animation
   *
   * @return {object} {mx, my} Simulated mouse locations in x and y
   */
  function animation() {
    if (customAnim) {
      return customAnim(mx, my, width, height, opts);
    }

    var time = Date.now() * 0.0015;
    mx = width * 0.5 + (0.4 * width * Math.cos(time));
    my = height * 0.5 + (0.6 * height * Math.cos(time) * Math.sin(time));
    return {mx: mx, my: my};
  }

  /**
   * Returns an object with all
   * the current options
   *
   * @return {object} Options object
   */
  function getOptions() {
    return opts;
  }

  /**
   * Options setter. Will override
   * only options passed in and default
   * the rest
   */
  function setOptions(options) {
    for (var key in options) {
      opts[key] = options[key];
    }
  }

  /**
   * Returns whether the mouse
   * is currently active or not
   * i.e. is the field in interactive
   * mode
   *
   * @return {bool} mouse enabled state
   */
  function getMouseState() {
    return opts.mouse;
  }

  /**
   * Set's whether the mouse is active/
   * is the field in interactive mode
   *
   * @return {bool} mouse enabled state
   */
  function setMouseState(state) {
    opts.mouse = state;
    return opts.mouse;
  }

  /*
   * Kick's off the animation both
   * mouse and function activated
   */
  function start() {
    running = true;
    frame();
  }

  /*
   * Pauses all animation
   */
  function stop() {
    running = false;
  }

  /* Set's a custom animation function
   * See docs for further explanation of
   * variables passed and response expected
   * as well as an example
   */
  function setCustomAnimation(func) {
    customAnim = func;
  }

  /* All methods returned to the user */
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
