#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import sys
import re
from subprocess import Popen, PIPE

import logging
from logging.handlers import RotatingFileHandler

progname = sys.argv[0]
logfile = '/var/log/run-varnish.log'
stderr = sys.stderr
stdout = sys.stdout
exit = sys.exit
__base = os.getcwd()

specialMatch = re.compile(r'^(\w+)$').search
dirSearch = re.compile(r'^(\/var\/lib\/vclfiddle\/vclfiddle\-[\w\/\-]+)$').search


def msgWarn(msg=''):
    if msg:
        stderr.write(msg + '\n')
    else:
        stderr.write("Usage: %s IMAGENAME DIRPATH\n" % (__base + progname))
    exit(2)


def create_rotating_log(msg, level=''):
    """ Creates a rotating log """
    path = '/var/log/run-varnish.log'
    level = level or 'info'
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - [%(levelname)s] - %(message)s')

    logger = logging.getLogger("VCLFiddle")
    logger.setLevel(logging.DEBUG)

    # add a rotating handler
    handler = RotatingFileHandler(path,
                                  maxBytes=10000000,
                                  backupCount=3)
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    if level == 'error':
        logger.error(msg)
    elif level == 'debug':
        logger.debug(msg)
        logger.info(msg)
    else:
        logger.info(msg)


def main():
    imageName = sys.argv[1]
    dirPath = sys.argv[2]

    if not bool(specialMatch(imageName)):
        msgErr = 'Invalid characters in Image {}'.format(imageName)
        create_rotating_log(msgErr, 'error')
        msgWarn(msgErr)

    if not bool(dirSearch(dirPath)):
        msgErr = 'Invalid characters in Path {}'.format(dirPath)
        create_rotating_log(msgErr, 'error')
        msgWarn(msgErr)

    os.environ['PATH'] = "/bin:/usr/bin"
    cm = Popen(['/usr/bin/docker',
                'run', '--rm', '-v', '{}:/fiddle'.format(dirPath), '{}'.format(imageName)],
               stdin=PIPE, stdout=PIPE, stderr=PIPE)
    stdout, stderr = cm.communicate()
    create_rotating_log('imageName: {}, dirPath: {}'.format(imageName, dirPath), 'info')
    #print stderr
    #print stdout
    exit(0)

if len(sys.argv) < 3:
    msgWarn()

if __name__ == "__main__":
    main()
