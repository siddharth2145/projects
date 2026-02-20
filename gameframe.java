
import javax.swing.JFrame;

public class gameframe extends JFrame{
        gameframe(){
              this.add(new gamepanel());
              this.setTitle("snake game");
              this.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
              this.setResizable(false);
              this.pack();
              this.setVisible(true);
              this.setLocale(null);
        }
    
}