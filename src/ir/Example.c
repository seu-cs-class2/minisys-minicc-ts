// 本例程充分测试了各项MiniC特性的支持
// 前三行将被剔除

int a; // global constant
// function definition
void func(int a, int b) {
  int z;
  z = a / b; // div
  return;
}
int foo(int x) {
  return 2; // return nothing
}
int main(void) {
  // local decl
  int a;
  int b;
  // int c[10]; // array definition
  a = 10;
  b = 20;
  // c[2] = c[1] + 2 + a + b; // array access
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
  return 0;
}