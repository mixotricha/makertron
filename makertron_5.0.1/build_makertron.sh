rm -rf makertron_client
rm -rf makertron_server

git clone https://github.com/mixotricha/makertron_client
git clone https://github.com/mixotricha/makertron_server

mv makertron_client/makertron_5.0.0/* . 
mv makertron_server/makertron_server_5.0.0/* . 

rm -rf bundle.js 

webpack --progress --colors
 
#sudo docker rm -f makertron
#sudo docker build -t makertron .

#sudo docker run -d --name server -p 3000:3000 -p 80:80 makertron 



