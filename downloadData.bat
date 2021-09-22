if not exist "data" mkdir data
curl https://shouldervis.chpc.utah.edu/kinevis/healthy.zip --output data\healthy.zip
powershell.exe -NoP -NonI -Command "Expand-Archive '.\data\healthy.zip' '.\data\healthy\'"
del data\healthy.zip
