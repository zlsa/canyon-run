
function clamp(a, n, b) {
  if(typeof b == 'undefined') b = Infinity;
  if(a > b) {
    var temp = a;
    a = b;
    b = temp;
  }
  if(n < a) return a;
  if(n > b) return b;
  return n;
}

function radians(deg) {
  return deg * Math.PI / 180;
}

function degrees(rad) {
  return rad / Math.PI * 180;
}

function lerp(il, i, ih, ol, oh) {
  return ol + (oh - ol) * (i - il) / (ih - il);
}

function slerp(il,i,ih,ol,oh) {
  return lerp(-1,Math.sin(lerp(il,i,ih,-Math.PI/2,Math.PI/2)),1,ol,oh);
}

function clerp(il, i, ih, ol, oh) {
  return clamp(ol,  lerp(il, i, ih, ol, oh), oh);
}

function distance_2d(d) {
  return Math.sqrt(Math.pow(d[0], 2) + Math.pow(d[1], 2));
}

function time_difference(now, start) {
  return (now - start);
}

function with_scope(context, func) {
  return function() {
    if(func)
      func.apply(context, arguments);
  };
}

exports.radians = radians;
exports.degrees = degrees;

exports.clamp = clamp;
exports.lerp = lerp;
exports.clerp = clerp;

exports.distance_2d = distance_2d;

exports.with_scope = with_scope;

