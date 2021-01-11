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

int main(void) {
  int result;
  result = fib(5);
  return 0;
}