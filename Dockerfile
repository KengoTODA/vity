FROM python:2
ENV VITY_HOME /etc/vity

RUN mkdir -p $VITY_HOME && pip install virtualenv
COPY ./pip.deps $VITY_HOME/pip.deps
COPY ./bin/* $VITY_HOME/bin/
RUN cd $VITY_HOME && sh $VITY_HOME/bin/setup-virtualenv.sh && pip install -r $VITY_HOME/pip.deps
