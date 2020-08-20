#! /bin/bash
cd thirdparty
tar zxfv ../../archives/mecab-0.996-ko-0.9.2.tar.gz
cd mecab-0.996-ko-0.9.2
./configure
make
make check
sudo make install
sudo ldconfig  # In case of error: libmecab.so.2: cannot open shared object file: No such file or directory

cd ..
tar zxfv ../../archives/mecab-ko-dic-2.1.1-20180720.tar.gz
cd mecab-ko-dic-2.1.1-20180720.tar.gz
./configure
make