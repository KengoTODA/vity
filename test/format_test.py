
from nose.tools import *
from nose_parameterized import parameterized


import os
import re

target_file_paths = []

for root, dirs, files in os.walk('./vity/'):
    file_paths = filter(lambda p: p.endswith('.py'),
                        map(lambda p: os.path.join(root, p), files))
    target_file_paths += file_paths

for root, dirs, files in os.walk('./sql/'):
    file_paths = map(lambda p: os.path.join(root, p), files)
    target_file_paths += file_paths

for root, dirs, files in os.walk('./html/js'):
    file_paths = filter(lambda p: '/js/lib/' not in p,
                        map(lambda p: os.path.join(root, p), files))
    target_file_paths += file_paths

for root, dirs, files in os.walk('./html/css'):
    file_paths = filter(lambda p: '/css/lib/' not in p and '/fonts/' not in p,
                        map(lambda p: os.path.join(root, p), files))
    target_file_paths += file_paths

for root, dirs, files in os.walk('./html'):
    file_paths = filter(lambda p: '.html' in p,
                        map(lambda p: os.path.join(root, p), files))
    target_file_paths += file_paths

target_file_paths = filter(lambda p: not p.endswith('.swp'), target_file_paths)
target_file_paths += ['./vity-http.py', './vity-ws.py']

for p in target_file_paths:
    print p


@nottest
def check_tab(line):
    return '\t' not in line

@nottest
def check_trailing_space(line):
    return re.search(r'[ \t\f\v]+$', line) is None


@parameterized(target_file_paths)
def test_format(file_path):
    with open(file_path) as f:
        lines = f.readlines()
    rs_tab = map(check_tab, lines)
    rs_trailing = map(check_trailing_space, lines)
    err_msg = file_path + ' contains tabs or trailing spaces'
    assert_true(all(rs_tab + rs_trailing), msg=err_msg)


