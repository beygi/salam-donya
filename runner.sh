#!/bin/bash
FILENAME=fetcher.out

while (true) do
	if ps aux |  grep "mainWeb.js" | grep -v grep > /dev/null
	then
		echo -n ""
	else
		date
		echo "process not exists , rerun "
		nohup nodejs mainWeb.js &> log.out &
	fi
	sleep 10
done
