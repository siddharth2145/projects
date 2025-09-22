import cv2
import time
import mediapipe as mp

class handdetector:
    def __init__(self, mode=False, maxHands=2, detectionCon=0.5, trackCon=0.5):
        self.mode = mode
        self.maxHands = maxHands
        self.detectionCon = detectionCon
        self.trackCon = trackCon

        self.mphands = mp.solutions.hands
        self.hands = self.mphands.Hands(
            static_image_mode=self.mode,
            max_num_hands=self.maxHands,
            min_detection_confidence=self.detectionCon,
            min_tracking_confidence=self.trackCon
        )
        self.mpDraw = mp.solutions.drawing_utils

    def findhands(self, img, draw=True):
        imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        self.results = self.hands.process(imgRGB)

        if self.results.multi_hand_landmarks:
            for handslms in self.results.multi_hand_landmarks:
                if draw:
                    self.mpDraw.draw_landmarks(img, handslms,
                                               self.mphands.HAND_CONNECTIONS)

        return img
    def findposition(self,img,handno=0, draw=True):
        lmList=[]
        if self.results.multi_hand_landmarks:
            myhands=self.results.multi_hand_landmarks[handno]

        for id, lm in enumerate(myhands.landmark):
            # print(id,lm)
            h, w, c = img.shape
            cx, cy = int(lm.x * w, ), int(lm.y * h)
            print(id, cx, cy)
            lmList.append([id,cx,cy])
            if draw:
               cv2.circle(img, (cx, cy), 15, (255, 0, 255), cv2.FILLED)  # to highlight the ineterested landmark
        return lmList


def main():
    ptime = 0
    ctime = 0
    cap = cv2.VideoCapture(0)
    detector = handdetector()

    while True:
        success, img = cap.read()
        img=detector.findhands(img)
        lmlist=detector.findposition(img)
        if len(lmlist)!=0:
           print(lmlist)
        if not success:
            break

        img = detector.findhands(img)
        ctime = time.time()
        fps = 1 / (ctime - ptime) if ctime != ptime else 0
        ptime = ctime

        cv2.putText(img, str(int(fps)), (10, 70),
                    cv2.FONT_HERSHEY_DUPLEX, 3, (255, 0, 255), 3)

        cv2.imshow("Image", img)
        if cv2.waitKey(1) & 0xFF == 27:  # Press 'ESC' to exit
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()

