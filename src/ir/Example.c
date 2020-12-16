// 本例程充分测试了各项MiniC特性的支持
// 前三行将被剔除

int a; // global constant
// function definition
void func(int a, int b) {
  int z;
  z = a / b; // div
  return z;
}
int foo(int x) {
  return; // return nothing
}
int main(void) {
  // local decl
  int a;
  int b;
  a = 10;
  b = 20;
  while (a > b) { // while
    a = 15;
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
  return;
}