void show_red_leds(int code) {
  $0xFFFFC60 = code;
  return;  
}

void show_yellow_leds(int code) {
  $0xFFFFC62 = code;
  return;  
}

void show_green_leds(int code) {
  $0xFFFFC64 = code;
  return;  
}

void delay(int ms) {
  int count;
  count = 10000;
  while (count > 0) {
    count = count - 1;
  }
  return;
}

int get_switches_input(void) {
  int result;
  result = 0;
  return result;
}

int main(void) {
  int switches;
  int reds;
  int yellows;
  int greens;
  while (1) {
    switches = get_switches_input();
    reds = switches >> 16;
    yellows = (switches >> 8) & 0x000000ff;
    greens = switches & 0x000000ff;
    show_red_leds(reds);
    show_yellow_leds(yellows);
    show_green_leds(greens);
    delay(100);
  }
  return 0;
}