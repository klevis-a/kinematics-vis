curl https://shouldervis.chpc.utah.edu/kinevis/csv.zip --output csv.zip
powershell.exe -NoP -NonI -Command "Expand-Archive '.\csv.zip' '.\csv\'"
del csv.zip
