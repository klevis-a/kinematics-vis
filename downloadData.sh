mkdir -p data
curl https://shouldervis.chpc.utah.edu/kinevis/healthy.zip --output data/healthy.zip
unzip data/healthy.zip -d data/healthy
rm data/healthy.zip
