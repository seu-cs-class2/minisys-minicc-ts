int a; // global constant
int arr[15]; // global array declaration
// function definition
int fib(int x) {
  int a;
  int b;
  if (x == 1) {
    return 1;
  }
  if (x == 2) {
    return 0;
  }
  a = fib(x - 1);
  b = fib(x - 2);
  return a + b;
}

int foo(int x) {
  return 2; // return nothing
}

int main(void) {
  // local decl
  int a;
  int b;
  int i;
  int result;
  a = 10;
  b = 20;
  i = 0;

  while (i < 15) {
    arr[i] = i;
    i = i + 1;
  }

  arr[3] = arr[1] + 2 + a + b + $0x66;

  while (a > b) { // while
    a = 15;
    $0x00 = 1; // addr access
    while (a == 1) { // nested while
      int c; // local decl in compound_stmt
      b = b * 2;
      foo(b); // function call
      a = foo(b); // call and assign
      break;
    }
    if (a > b) { // if
      b = b + a;
      continue; // break-continue control
    }
    if (a < b) {
      break;
    }
    // ops
    a = a ^ b;
    a = !a;
    a = a || b;
  }

  result = fib(5);
  
  return result;
}