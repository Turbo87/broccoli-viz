var dot = require('../dot');
var assert = require('assert');
var rank = require('../rank');
var processGraph  = require('../process');
var nodesById = require('../nodes-by-id');
var buildGraph = require('../build-graph');

describe('dot', function() {
  var a = {
    _id: 1,
    id: { name: 'a', },
    stats: {
      time: {
        self: 40 * 1e6,
      },
      fs: {
        lstatSync: {
          count: 10,
          time: 20 * 1e6
        },
        openSync: {
          count: 2,
          time: 15 * 1e6,
        },
      },
    },
    children: []
  };

  it('displays self and total time by default', function() {
    var result = dot(processGraph([a]));

    assert.equal(result, 'digraph G { ratio = \"auto\" 1 [shape=box, style=solid, colorscheme=\"rdylbu9\", color=7, label=\" 1 \na\n time.self (40ms) \n time.total (40ms) \n \"]\n}');

    result = dot(processGraph([a], { stats: null }));

    assert.equal(result, 'digraph G { ratio = \"auto\" 1 [shape=box, style=solid, colorscheme=\"rdylbu9\", color=7, label=\" 1 \na\n time.self (40ms) \n time.total (40ms) \n \"]\n}');

    result = dot(processGraph([a], { stats: undefined }));

    assert.equal(result, 'digraph G { ratio = \"auto\" 1 [shape=box, style=solid, colorscheme=\"rdylbu9\", color=7, label=\" 1 \na\n time.self (40ms) \n time.total (40ms) \n \"]\n}');
  });

  it('can display stats matching a glob', function() {
    var result = dot(processGraph([a]), { stats: ['time.self'] });

    assert.equal(result, 'digraph G { ratio = \"auto\" 1 [shape=box, style=solid, colorscheme=\"rdylbu9\", color=7, label=\" 1 \na\n time.self (40ms) \n \"]\n}');

    result = dot(processGraph([a]), { stats: ['fs.*.count'] });

    assert.equal(result, 'digraph G { ratio = \"auto\" 1 [shape=box, style=solid, colorscheme=\"rdylbu9\", color=7, label=\" 1 \na\n fs.lstatSync.count (10) \n fs.openSync.count (2) \n \"]\n}');
  });

  it('treats stats named time as nanoseconds', function() {
    result = dot(processGraph([a]), { stats: ['fs.lstatSync.*'] });

    assert.equal(result, 'digraph G { ratio = \"auto\" 1 [shape=box, style=solid, colorscheme=\"rdylbu9\", color=7, label=\" 1 \na\n fs.lstatSync.count (10) \n fs.lstatSync.time (20ms) \n \"]\n}');
  });

  it('aliases totalTime to time.total', function() {
    var result = dot(processGraph([a]), { stats: ['time.total'] });

    assert.equal(result, 'digraph G { ratio = \"auto\" 1 [shape=box, style=solid, colorscheme=\"rdylbu9\", color=7, label=\" 1 \na\n time.total (40ms) \n \"]\n}');
  });

  it('can display stats matching multiple globs', function() {
    var result = dot(processGraph([a]), { stats: ['time.*', 'fs.*.count'] });

    assert.equal(result, 'digraph G { ratio = \"auto\" 1 [shape=box, style=solid, colorscheme=\"rdylbu9\", color=7, label=\" 1 \na\n time.self (40ms) \n time.total (40ms) \n fs.lstatSync.count (10) \n fs.openSync.count (2) \n \"]\n}');
  });
});


describe('rank', function() {
  it('empty', function(){
    var g = buildGraph([
      {
        _id: 1,
        stats: {
          time: {
            self: 0,
          }
        },
        children: []
      }
    ]);

    var ranked = rank(g).nodes;

    assert.deepEqual(ranked.map(byLevel), [0]);
  });

  function byLevel(node) {
    return node.stats._broccoli_viz.level;
  }

  it('one path', function(){
    var a = {
      _id: 2,
      stats: {
        time: {
          self: 0,
        },
      },
      children: [1]
    };

    var b = {
      _id: 1,
      stats: {
        time: {
          self: 0,
        },
      },
      children: []
    };


    var g = buildGraph([a, b]);

    var ranked = rank(g).nodes;

    assert.deepEqual(ranked.map(byLevel), [0, 0]);
  });

  it('slighty more complex graph', function() {
    /*
            ┌───────────────┐
            │#1 TotalTime: 5│
            └───────────────┘
                    │
        ╔═══════════╩──────────┐
        ║                      │
        ▼                      ▼
┌───────────────┐      ┌───────────────┐
│#2 TotalTime: 4│      │#3 TotalTime: 3│
└───────────────┘      └───────────────┘
        ║                      │
        ║                      │
        ▼                      ▼
┌───────────────┐      ┌───────────────┐
│#4 TotalTime: 2│      │#5 TotalTime: 2│
└───────────────┘      └───────────────┘
        ║                      │
        ║                      │
        ▼                      ▼
┌───────────────┐     ┌────────────────┐
│#6 TotalTime: 2│     │#7 TotalTime: 1 │
└───────────────┘     └────────────────┘
    */

    var g = buildGraph([{
      _id: 1,
      stats: {
        time: {
          self: 0,
        },
      },
      children: [3, 2]
    }, {
      _id: 2,
      stats: {
        time: {
          self: 2,
        },
      },
      children: [4]
    }, {
      _id: 3,
      stats: {
        time: {
          self: 1,
        },
      },
      children: [5]
    }, {
      _id: 4,
      stats: {
        time: {
          self: 0,
        },
      },
      children: [6]
    }, {
      _id: 5,
      stats: {
        time: {
          self: 1,
        },
      },
      children: [7]
    }, {
      _id: 6,
      stats: {
        time: {
          self: 2,
        },
      },
      children: []
    }, {
      _id: 7,
      stats: {
        time: {
          self: 1,
        },
      },
      children: []
    }]);

    var ranked = rank(g).nodes;

    assert.deepEqual(ranked.map(byLevel), [0, 0, 1, 0, 1, 0, 1]);
  });

});

