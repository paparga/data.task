declare class Task<E,V> {
  public fork: ((reject: (err: E) => void, success: (value: V) => void) => void)
  private cleanup
      
  //Constructing
  constructor(fork: ((reject: (err: E) => void, resolve: (value: V) => void) => void), cleanup?: (f: any) => void)

  static of<E,S>(a: S): Task<E,S>
  static rejected<S,V>(a: S): Task<S,V>
    
  //Transforming
  map<S>(fn: (t: V) => S): Task<E,S>
  chain<S>(fn: (t: V) => Task<E,S>): Task<E,S> 
  orElse<F>(fn: (t: E) => Task<F,V>): Task<F,V>
  rejectedMap<F>(fn: (t: E) => F): Task<F,V>

  //Map N
  map2<S, N>(fn: (t1: V, t2: N) => S, n2: Task<E,N>): Task<E,S>  
  map3<S, N, O>(fn: (t1: V, t2: N, t3: O) => S, n2: Task<E,N>, n3: Task<E,O>): Task<E,S>  
  map4<S, N, O, P>(fn: (t1: V, t2: N, t3: O, t4: P) => S, n2: Task<E,N>, n3: Task<E,O>, n4: Task<E,P>): Task<E,S>  
  map5<S, N, O, P, Q>(fn: (t1: V, t2: N, t3: O, t4: P, t5: Q) => S, n2: Task<E,N>, n3: Task<E,O>, n4: Task<E,P>, n5: Task<E,Q>): Task<E,S>
  map6<S, N, O, P, Q, R>(fn: (t1: V, t2: N, t3: O, t4: P, t5: Q, t6: R) => S, n2: Task<E,N>, n3: Task<E,O>, n4: Task<E,P>, n5: Task<E,Q>, n6: Task<E,R>): Task<E,S>
  map7<S, N, O, P, Q, R, T>(fn: (t1: V, t2: N, t3: O, t4: P, t5: Q, t6: R, t7: T) => S, n2: Task<E,N>, n3: Task<E,O>, n4: Task<E,P>, n5: Task<E,Q>, n6: Task<E,R>, n7: Task<E,T>): Task<E,S>
  map8<S, N, O, P, Q, R, T, U>(fn: (t1: V, t2: N, t3: O, t4: P, t5: Q, t6: R, t7: T, t8: U) => S, n2: Task<E,N>, n3: Task<E,O>, n4: Task<E,P>, n5: Task<E,Q>, n6: Task<E,R>, n7: Task<E,T>, n8: Task<E,U>): Task<E,S>
  map9<S, N, O, P, Q, R, T, U, A>(fn: (t1: V, t2: N, t3: O, t4: P, t5: Q, t6: R, t7: T, t8: U, t9: A) => S, n2: Task<E,N>, n3: Task<E,O>, n4: Task<E,P>, n5: Task<E,Q>, n6: Task<E,R>, n7: Task<E,T>, n8: Task<E,U>, n9: Task<E,A>): Task<E,S>
  map10<S, N, O, P, Q, R, T, U, A, B>(fn: (t1: V, t2: N, t3: O, t4: P, t5: Q, t6: R, t7: T, t8: U, t9: A, t10: B) => S, n2: Task<E,N>, n3: Task<E,O>, n4: Task<E,P>, n5: Task<E,Q>, n6: Task<E,R>, n7: Task<E,T>, n8: Task<E,U>, n9: Task<E,A>, n10: Task<E,B>): Task<E,S>  
}

declare module "data.task" {
	export = Task
}

