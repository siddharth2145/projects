
import os
import time

from comtypes import CLSCTX, CLSCTX_ALL

import handdetectionmodule as htm
import math
import mediapipe as mp
import numpy as np
import cv2
from pycaw.pycaw import AudioUtilities
from ctypes import cast,POINTER
from pycaw.pycaw import AudioUtilities,IAudioEndpointVolume


######################
wcam,hcam=640,480
######################
cap=cv2.VideoCapture(0)
ptime=0
volbar=400
cap.set(3,wcam)
cap.set(4,hcam)
detector1=htm.handdetector(detectionCon=0.75)
device = AudioUtilities.GetSpeakers()
Interface=device.Activate(
    IAudioEndpointVolume._iid_,CLSCTX_ALL,None)
volume=cast(Interface,POINTER(IAudioEndpointVolume))
volRange=volume.GetVolumeRange()
print(volume.SetMasterVolumeLevel(-5.0,None))
minvol=volRange[0]
maxvol=volRange[1]
vol =0
volper=0
#volume = device.EndpointVolume
#print(f"- Volume level: {volume.GetMasterVolumeLevel()} dB")
while True:
    success,img=cap.read()
    img=detector1.findhands(img)
    lmlist=detector1.findposition(img,draw=False)
    if len(lmlist) !=0:
        #print(lmlist[4],lmlist[8])
        x1,y1=lmlist[4][1],lmlist[4][2]
        x2,y2=lmlist[8][1],lmlist[8][2]
        cx,cy=(x1+x2)//2,(y1+y2)//2
        cv2.circle(img,(x1,y1),15,(255,0,255),cv2.FILLED)
        cv2.circle(img, (x2, y2), 15, (255, 0, 255), cv2.FILLED)
        cv2.line(img,(x1,y1),(x2,y2),(255,0,255),3)
        cv2.circle(img, (cx, cy), 15, (255, 0, 255), cv2.FILLED)
        length=math.hypot(x2-x1,y2-y1)

        #print(length)
        vol=np.interp(length,[50,300],[minvol,maxvol])
        volbar=np.interp(length,[50,300],[400,150])
        volper=np.interp(length,[50,300],[0,100])
        if len(lmlist)!=0 and length2<30:
             volume.SetMasterVolumeLevel(vol,None)
             cv2.rectangle(img, (50, 150), (85, 400), (0, 255, 0), 3)
             cv2.rectangle(img, (50, int(volbar)), (85, 400), (0, 255, 0), 3)
             cv2.rectangle(img, (50, int(volbar)), (85, 400), (0, 255, 0), cv2.FILLED)
             cv2.putText(img, f"{int(volper)}%", (40, 450), cv2.FONT_HERSHEY_DUPLEX, 2,
                    (255, 0, 255), 2)
        
        if length<50:
            cv2.circle(img, (cx, cy), 15, (0, 256,0 ), cv2.FILLED)
  
    ctime=time.time()
    fps=1/(ctime-ptime)
    ptime=ctime
    cv2.putText(img,f"fps:{int(fps)}",(30,70),cv2.FONT_HERSHEY_DUPLEX,2
                ,(255,0,255),2)
    cv2.imshow("image",img)
    cv2.waitKey(1)

""" 
print(f"Audio output: {device.FriendlyName}")
print(f"- Muted: {bool(volume.GetMute())}")
print(f"- Volume level: {volume.GetMasterVolumeLevel()} dB")
print(f"- Volume range: {volume.GetVolumeRange()[0]} dB - {volume.GetVolumeRange()[1]} dB")
volume.SetMasterVolumeLevel(-20.0, None)

"""
