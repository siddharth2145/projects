import cv2
import time
import mediapipe as mp
from handdetectionmodule import handdetector
from facedetectionmodule import facedetector

cap=cv2.VideoCapture(0)#to acces the webcam
mphands=mp.solutions.hands#to access hands funstion
hands=mphands.Hands(False)
detector=handdetector()
detector=facedetector(mindetectioncon=0.75)
mpDraw=mp.solutions.drawing_utils#to access the mp drawing utillities
ptime=0
ctime=0
while True:
    success,img=cap.read()#if read is successful
    imgRGB=cv2.cvtColor(img,cv2.COLOR_BGR2RGB)#the image should be converted in RGB colors
    results=hands.process(imgRGB,)# Run hand detection on the RGB frame and store the output or to store the  result or processed image from imgRGB
    img, bboxs =detector.findface(img)
    if results.multi_hand_landmarks:#for detecting multiple hands are present or not
        for handslms in results.multi_hand_landmarks:
            for id,lm in enumerate(handslms.landmark):
                #print(id,lm)
                h,w,c=img.shape
                cx,cy=int(lm.x*w,),int(lm.y*h)
                print(id,cx,cy)

                if id==5:#track the required landmarks ex-tip of thumb
                    cv2.circle(img,(cx,cy),15,(255,0,255),cv2.FILLED)#to highlight the ineterested landmark
            mpDraw.draw_landmarks(img,handslms,mphands.HAND_CONNECTIONS)#to draw the hand landmarks and handconnections

    ctime=time.time()
    fps=1/(ctime-ptime)
    ptime=ctime

    cv2.putText(img,str(int(fps)),(10,70),cv2.FONT_HERSHEY_DUPLEX,3,(255,0,255),3)

    if not success:
        break

    cv2.imshow("Image", img) #opens a window
    cv2.waitKey(1)