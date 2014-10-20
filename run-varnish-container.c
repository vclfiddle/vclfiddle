#define SCRIPT_PATH "/opt/vclfiddle/run-varnish-container.pl"
main(ac, av)
  char **av;
{
  execv(SCRIPT_PATH, av);
}