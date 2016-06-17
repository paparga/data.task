'use strict';


/**
 * A helper for delaying the execution of a function.
 * @private
 * @summary (Any... -> Any) -> Void
 */
var delayed = typeof setImmediate !== 'undefined'?  setImmediate
            : typeof process !== 'undefined'?       process.nextTick
            : /* otherwise */                       setTimeout

/**
 * @module lib/task
 */
module.exports = Task;

// -- Implementation ---------------------------------------------------

/**
 * The `Task[α, β]` structure represents values that depend on time. This
 * allows one to model time-based effects explicitly, such that one can have
 * full knowledge of when they're dealing with delayed computations, latency,
 * or anything that can not be computed immediately.
 *
 * A common use for this structure is to replace the usual Continuation-Passing
 * Style form of programming, in order to be able to compose and sequence
 * time-dependent effects using the generic and powerful monadic operations.
 *
 * @class
 * @summary
 * ((α → Void), (β → Void) → Void), (Void → Void) → Task[α, β]
 *
 * Task[α, β] <: Chain[β]
 *               , Monad[β]
 *               , Functor[β]
 *               , Applicative[β]
 *               , Semigroup[β]
 *               , Monoid[β]
 *               , Show
 */
function Task(computation, cleanup) {
  this.fork = computation;

  this.cleanup = cleanup || function() {};
}

/**
 * Constructs a new `Task[α, β]` containing the single value `β`.
 *
 * `β` can be any value, including `null`, `undefined`, or another
 * `Task[α, β]` structure.
 *
 * @summary β → Task[α, β]
 */
Task.prototype.of = function _of(b) {
  return new Task(function(_, resolve) {
    return resolve(b);
  });
};

Task.of = Task.prototype.of;

/**
 * Constructs a new `Task[α, β]` containing the single value `α`.
 *
 * `α` can be any value, including `null`, `undefined`, or another
 * `Task[α, β]` structure.
 *
 * @summary α → Task[α, β]
 */
Task.prototype.rejected = function _rejected(a) {
  return new Task(function(reject) {
    return reject(a);
  });
};

Task.rejected = Task.prototype.rejected;

// -- Functor ----------------------------------------------------------

/**
 * Transforms the successful value of the `Task[α, β]` using a regular unary
 * function.
 *
 * @summary @Task[α, β] => (β → γ) → Task[α, γ]
 */
Task.prototype.map = function _map(f) {
  var fork = this.fork;
  var cleanup = this.cleanup;

  return new Task(function(reject, resolve) {
    return fork(function(a) {
      return reject(a);
    }, function(b) {
      return resolve(f(b));
    });
  }, cleanup);
};

// -- Chain ------------------------------------------------------------

/**
 * Transforms the succesful value of the `Task[α, β]` using a function to a
 * monad.
 *
 * @summary @Task[α, β] => (β → Task[α, γ]) → Task[α, γ]
 */
Task.prototype.chain = function _chain(f) {
  var fork = this.fork;
  var cleanup = this.cleanup;

  return new Task(function(reject, resolve) {
    return fork(function(a) {
      return reject(a);
    }, function(b) {
      return f(b).fork(reject, resolve);
    });
  }, cleanup);
};

// -- Apply ------------------------------------------------------------

/**
 * Applys the successful value of the `Task[α, (β → γ)]` to the successful
 * value of the `Task[α, β]`
 *
 * @summary @Task[α, (β → γ)] => Task[α, β] → Task[α, γ]
 */

Task.prototype.ap = function _ap(that) {
  var forkThis = this.fork;
  var forkThat = that.fork;
  var cleanupThis = this.cleanup;
  var cleanupThat = that.cleanup;

  function cleanupBoth(state) {
    cleanupThis(state[0]);
    cleanupThat(state[1]);
  }

  return new Task(function(reject, resolve) {
    var func, funcLoaded = false;
    var val, valLoaded = false;
    var rejected = false;
    var allState;

    var thisState = forkThis(guardReject, guardResolve(function(x) {
      funcLoaded = true;
      func = x;
    }));

    var thatState = forkThat(guardReject, guardResolve(function(x) {
      valLoaded = true;
      val = x;
    }));

    function guardResolve(setter) {
      return function(x) {
        if (rejected) {
          return;
        }

        setter(x);
        if (funcLoaded && valLoaded) {
          delayed(function(){ cleanupBoth(allState) });
          return resolve(func(val));
        } else {
          return x;
        }
      }
    }

    function guardReject(x) {
      if (!rejected) {
        rejected = true;
        return reject(x);
      }
    }

    return allState = [thisState, thatState];
  }, cleanupBoth);
};



Task.prototype.map2 = function _map2(f, t2){
  var fork = this.fork;
  var cleanup = this.cleanup;

  function par2(_t1){
    return function(_t2){
      return f(_t1, _t2)
    }
  }

  return new Task(function(reject, resolve) {
    return fork(function(a) {
      return reject(a);
    }, function(b) {
      return resolve(par2(b));
    });
  }, cleanup).ap(t2);
};


Task.prototype.map3 = function _map3(f, t2, t3){
  var fork = this.fork;
  var cleanup = this.cleanup;

  function par3(_t1){
    return function(_t2){
      return function(_t3){
        return f(_t1, _t2, _t3);
      }
    }
  }

  return new Task(function(reject, resolve) {
    return fork(function(a) {
      return reject(a);
    }, function(b) {
      return resolve(par2(b));
    });
  }, cleanup).ap(t2).ap(t3);

};

Task.prototype.map4 = function _map4(f, t2, t3, t4){
  var fork = this.fork;
  var cleanup = this.cleanup;

  function par4(_t1){
    return function(_t2){
      return function(_t3){
        return function(_t4){
          return f(_t1, _t2, _t3, _t4);
        }        
      }
    }
  }
  return new Task(function(reject, resolve) {
    return fork(function(a) {
      return reject(a);
    }, function(b) {
      return resolve(par2(b));
    });
  }, cleanup).ap(t2).ap(t3).ap(t4);
};

Task.prototype.map5 = function _map5(f, t2, t3, t4, t5){
  var fork = this.fork;
  var cleanup = this.cleanup;

  function par5(_t1){
    return function(_t2){
      return function(_t3){
        return function(_t4){
          return function(_t5){
            return f(_t1, _t2, _t3, _t4, _t5);
          }         
        }        
      }
    }
  }
  return new Task(function(reject, resolve) {
    return fork(function(a) {
      return reject(a);
    }, function(b) {
      return resolve(par2(b));
    });
  }, cleanup).ap(t2).ap(t3).ap(t4).ap(t5);
};

Task.prototype.map6 = function _map6(f, t2, t3, t4, t5, t6){
  var fork = this.fork;
  var cleanup = this.cleanup;

  function par6(_t1){
    return function(_t2){
      return function(_t3){
        return function(_t4){
          return function(_t5){
            return function(_t6){
              return f(_t1, _t2, _t3, _t4, _t5, _t6);
            }
          }         
        }        
      }
    }
  }
  return new Task(function(reject, resolve) {
    return fork(function(a) {
      return reject(a);
    }, function(b) {
      return resolve(par2(b));
    });
  }, cleanup).ap(t2).ap(t3).ap(t4).ap(t5).ap(t6);
};

Task.prototype.map7 = function _map7(f, t2, t3, t4, t5, t6, t7){
  var fork = this.fork;
  var cleanup = this.cleanup;

  function par7(_t1){
    return function(_t2){
      return function(_t3){
        return function(_t4){
          return function(_t5){
            return function(_t6){
              return function(_t7){
                return f(_t1, _t2, _t3, _t4, _t5, _t6, _t7);
              }
            }
          }         
        }        
      }
    }
  }
  return new Task(function(reject, resolve) {
    return fork(function(a) {
      return reject(a);
    }, function(b) {
      return resolve(par2(b));
    });
  }, cleanup).ap(t2).ap(t3).ap(t4).ap(t5).ap(t6).ap(t7);
};

Task.prototype.map8 = function _map8(f, t2, t3, t4, t5, t6, t7, t8){
  var fork = this.fork;
  var cleanup = this.cleanup;

  function par8(_t1){
    return function(_t2){
      return function(_t3){
        return function(_t4){
          return function(_t5){
            return function(_t6){
              return function(_t7){
                return function(_t8){
                  return f(_t1, _t2, _t3, _t4, _t5, _t6, _t7, _t8);
                }
              }
            }
          }         
        }        
      }
    }
  }
  return new Task(function(reject, resolve) {
    return fork(function(a) {
      return reject(a);
    }, function(b) {
      return resolve(par2(b));
    });
  }, cleanup).ap(t2).ap(t3).ap(t4).ap(t5).ap(t6).ap(t7).ap(t8);
};

Task.prototype.map9 = function _map9(f, t2, t3, t4, t5, t6, t7, t8, t9){
  var fork = this.fork;
  var cleanup = this.cleanup;

  function par9(_t1){
    return function(_t2){
      return function(_t3){
        return function(_t4){
          return function(_t5){
            return function(_t6){
              return function(_t7){
                return function(_t8){
                  return function(_t9){
                    return f(_t1, _t2, _t3, _t4, _t5, _t6, _t7, _t8, _t9);
                  }
                }
              }
            }
          }         
        }        
      }
    }
  }
  return new Task(function(reject, resolve) {
    return fork(function(a) {
      return reject(a);
    }, function(b) {
      return resolve(par2(b));
    });
  }, cleanup).ap(t2).ap(t3).ap(t4).ap(t5).ap(t6).ap(t7).ap(t8).ap(t9);
};

Task.prototype.map10 = function _map10(f, t2, t3, t4, t5, t6, t7, t8, t9, t10){
  var fork = this.fork;
  var cleanup = this.cleanup;

  function par10(_t1){
    return function(_t2){
      return function(_t3){
        return function(_t4){
          return function(_t5){
            return function(_t6){
              return function(_t7){
                return function(_t8){
                  return function(_t9){
                    return function(_t10){
                      return f(_t1, _t2, _t3, _t4, _t5, _t6, _t7, _t8, _t9, _t10);
                    }
                  }
                }
              }
            }
          }         
        }        
      }
    }
  }
  return new Task(function(reject, resolve) {
    return fork(function(a) {
      return reject(a);
    }, function(b) {
      return resolve(par2(b));
    });
  }, cleanup).ap(t2).ap(t3).ap(t4).ap(t5).ap(t6).ap(t7).ap(t8).ap(t9).ap(t10);
};




// -- Semigroup ------------------------------------------------------------

/**
 * Selects the earlier of the two tasks `Task[α, β]`
 *
 * @summary @Task[α, β] => Task[α, β] → Task[α, β]
 */

Task.prototype.concat = function _concat(that) {
  var forkThis = this.fork;
  var forkThat = that.fork;
  var cleanupThis = this.cleanup;
  var cleanupThat = that.cleanup;

  function cleanupBoth(state) {
    cleanupThis(state[0]);
    cleanupThat(state[1]);
  }

  return new Task(function(reject, resolve) {
    var done = false;
    var allState;
    var thisState = forkThis(guard(reject), guard(resolve));
    var thatState = forkThat(guard(reject), guard(resolve));

    return allState = [thisState, thatState];

    function guard(f) {
      return function(x) {
        if (!done) {
          done = true;
          delayed(function(){ cleanupBoth(allState) })
          return f(x);
        }
      };
    }
  }, cleanupBoth);
};

// -- Monoid ------------------------------------------------------------

/**
 * Returns a Task that will never resolve
 *
 * @summary Void → Task[α, _]
 */
Task.empty = function _empty() {
  return new Task(function() {});
};

Task.prototype.empty = Task.empty;

// -- Show -------------------------------------------------------------

/**
 * Returns a textual representation of the `Task[α, β]`
 *
 * @summary @Task[α, β] => Void → String
 */
Task.prototype.toString = function _toString() {
  return 'Task';
};

// -- Extracting and recovering ----------------------------------------

/**
 * Transforms a failure value into a new `Task[α, β]`. Does nothing if the
 * structure already contains a successful value.
 *
 * @summary @Task[α, β] => (α → Task[γ, β]) → Task[γ, β]
 */
Task.prototype.orElse = function _orElse(f) {
  var fork = this.fork;
  var cleanup = this.cleanup;

  return new Task(function(reject, resolve) {
    return fork(function(a) {
      return f(a).fork(reject, resolve);
    }, function(b) {
      return resolve(b);
    });
  }, cleanup);
};

// -- Folds and extended transformations -------------------------------

/**
 * Catamorphism. Takes two functions, applies the leftmost one to the failure
 * value, and the rightmost one to the successful value, depending on which one
 * is present.
 *
 * @summary @Task[α, β] => (α → γ), (β → γ) → Task[δ, γ]
 */
Task.prototype.fold = function _fold(f, g) {
  var fork = this.fork;
  var cleanup = this.cleanup;

  return new Task(function(reject, resolve) {
    return fork(function(a) {
      return resolve(f(a));
    }, function(b) {
      return resolve(g(b));
    });
  }, cleanup);
};

/**
 * Catamorphism.
 *
 * @summary @Task[α, β] => { Rejected: α → γ, Resolved: β → γ } → Task[δ, γ]
 */
Task.prototype.cata = function _cata(pattern) {
  return this.fold(pattern.Rejected, pattern.Resolved);
};

/**
 * Swaps the disjunction values.
 *
 * @summary @Task[α, β] => Void → Task[β, α]
 */
Task.prototype.swap = function _swap() {
  var fork = this.fork;
  var cleanup = this.cleanup;

  return new Task(function(reject, resolve) {
    return fork(function(a) {
      return resolve(a);
    }, function(b) {
      return reject(b);
    });
  }, cleanup);
};

/**
 * Maps both sides of the disjunction.
 *
 * @summary @Task[α, β] => (α → γ), (β → δ) → Task[γ, δ]
 */
Task.prototype.bimap = function _bimap(f, g) {
  var fork = this.fork;
  var cleanup = this.cleanup;

  return new Task(function(reject, resolve) {
    return fork(function(a) {
      return reject(f(a));
    }, function(b) {
      return resolve(g(b));
    });
  }, cleanup);
};

/**
 * Maps the left side of the disjunction (failure).
 *
 * @summary @Task[α, β] => (α → γ) → Task[γ, β]
 */
Task.prototype.rejectedMap = function _rejectedMap(f) {
  var fork = this.fork;
  var cleanup = this.cleanup;

  return new Task(function(reject, resolve) {
    return fork(function(a) {
      return reject(f(a));
    }, function(b) {
      return resolve(b);
    });
  }, cleanup);
};
