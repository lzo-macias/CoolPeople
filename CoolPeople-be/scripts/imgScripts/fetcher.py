import os
import requests
from bs4 import BeautifulSoup
import urllib.parse


# Directory to save images
output_dir = 'images/candidateprofile'
os.makedirs(output_dir, exist_ok=True)

# List of candidate names
candidates = ["Rajkumar, Jenifer", "Narcisse, Mercedes", "Santana, Elvis", "Osse, Chi", "Farias, Amanda", "Joseph, Rita C", "Sanchez, Pierina A", "De La Rosa, Carmen", "Hanif, Shahana", "Nurse, Sandy", "Riley, Kevin C", "Brewer, Gale", "Aviles, Alexa", "Stevens, Althea V", "Wang, Allen H", "Williams, Jumaane D", "Williams, Nantasha", "Lander, Brad", "Menin, Julie", "Brooks-Powers, Selvena", "Abreu, Shaun", "Aldebol, Shirley", "Levine, Mark", "Adams, Eric L", "Ortiz, Antirson R", "Adams, Adrienne E", "Blake, Michael A", "Tischler, Harold", "Fisher, Corinne", "Myrie, Zellnor", "Huq, Md M", "Maloney, Virginia", "Willabus, Dimple", "Mamdani, Zohran K", "Carr, David M", "Zayas, Evette", "Arnwine, Dante", "Stringer, Scott M", "Bottcher, Erik", "Walden, James", "Tilson, Whitney R", "Cunningham, Bianca", "Sarantopoulos, George", "Hankerson, Tyrell D", "Smyth, Dermot", "Blas, Sarah", "Pogozelski, Paul J", "Brannan, Justin", "Cuomo, Andrew M", "Medina, Sarah", "Aquino, Angela", "Henderson, Jamell", "Caban, Tiffany", "Ramos, Jessica", "Hudson, Crystal", "Usmanov, Fedir", "Carter-Williams, Jozette", "Salaam, Yusef", "Trafficante, Liliana M", "Encarnacion, Elsie R", "Batchu, Sarah L", "Epstein, Harvey D", "Lopez, Wilfredo", "Banks, Christopher", "Lara, Jacqueline", "Ashman, Dion M", "Weiner, Anthony", "Sliwa, Curtis A", "Kornberg, Maya", "Chou, Benjamin", "Malave, Ismael", "El-Gamasy, Hatem", "Caruso, Alexander J", "Dinowitz, Eric", "Paladino, Vickie", "Florczak, Lukas", "Santosuosso, Kayla", "Storch, Rachel", "Diaz, David A", "Gordillo, Andrea", "Herbert-Guggenheim, Danielle", "Lerman, Brian A", "Krishnan, Shekar", "Hanks, Kamillah M", "Aronson, Vanessa T", "Lee, Linda", "Vernikov, Inna", "Barsamian, Dikran", "Coleman, Jess K", "Restler, Lincoln", "Cabrera, Fernando L", "Rivera, Joel R", "Perez Jr., Freddy", "Henriquez, Yanna M", "Frias, Ramses", "Altidor, Kenny", "Reyes, Nicholas", "Hodge Vasquez, Bryan", "Diaz, Rosa G", "Diakhate, Abou S", "Navarro, Sandro S", "Chow, Bernard", "Ryan, Allison L", "Alayeto, Clarisa", "Hitlall, Romeo", "LeGrand, Latoya", "Sanchez, Justin E", "Okporo, Edafe", "Levy, Deirdre", "Lopez, Michael A", "Murillo, Jason C", "Montoya, Erycka", "Quero, Luis E", "Actille, Treasure J", "Uribe, Jasmine", "Schulman, Lynn", "Lynch, Lawman", "Romeo, Dominick", "Robertson, Hector", "Aiken, David", "Louis, Farah", "Berry, Neil D", "Parker, Kevin S", "Marmorato, Kristy", "Felder, Simcha", "Lewinsohn, Elizabeth", "Daniels, Vera V", "Wetzler, Benjamin D", "Thomas-Henry, Shanel", "Bondy, Faith", "Ariola, Joann", "Mohan, Radhakrishna", "Vaichunas, Alicia B", "Torres, Jacqueline J", "Pacheco, Ricardo J", "Monserrate, Hiram", "Wong, Phil", "Reets-DuPont, Theona S", "King, Andy", "Thompson, Collin L", "Santana, Raymond", "Colon, Federico", "Singh, Japneet", "Haque, Shah S", "Dolan, Martin W", "Ung, Sandra", "Won, Julie", "Joseph, Shakur T", "Mealy, Darlene", "Pieters, Austin", "Brown, Elijah M", "Buthorn, John K", "Aulbach-Sidibe, Daniel K", "Nahom, Ronen", "Marte, Christopher", "Khan, Tiffany", "Gibbs, Edward", "Alny, Joe", "Gennaro, James F", "Feliz, Oswald", "Ye, Ling", "Sanchez, Elizabeth", "Anglade, Jean h", "Qiu, Helen J", "Manning, James L", "Gutierrez, Jennifer", "Hagen, Clifford A", "Brown, Telee", "Armstrong, Claire", "Wills, Ruben W", "Penafort, Christopher", "Ashiq, Abubakar", "Bartholomew, Dr. Selma K", "Zhuang, Susan", "Yu, Eric", "Wedderburn, Sharon", "Batista, Anthony", "Bauer, Chris F", "Rinaldi, Jonathan D", "Ben Zakar, Adam", "Rivera, Aidan", "Flores, Louis", "Chung, Youn", "Miller, Terrell", "Springs, Gordon", "Chan, Jerry", "Clarke, Athena", "Pelinkovic, Mustafa", "Marrero, Eddie", "Kagan, Ari", "Duran, Gonzalo", "Fitzgerald, Cleopatra", "Serrano, Christina", "Gillespie, Dr. Brandon D", "Harris, John R", "Harrison, Linda T", "Diaz, Elijah", "McGrath, Supreet", "Laurel-Smith, Abbey", "Maio, Danniel", "Nouinou, Fatimazohra", "Moseley, Montell C", "Saghir, Luke P", "Schargel, Gail", "Shaende, Jonas", "Shea, John E", "Thompson, Jammel A", "Williams, Jomo M", "Powers, Keith", "Sun,Calvin *", "Gibson, Vanessa", "Salamanca, Rafael", "Edwards, Khari", "Reynoso, Antonio", "Hoylman-Sigal, Brad", "McPhatter, Shanduke", "Del Valle, Von", "Grimes, Bashek", "Ikezi, Henry", "Richards, Donovan", "Roque, Erwin", "Colombo, Michael", "Fossella, Vito", "Gibson, Vanessa L", "Fossella, Vito J", "Sun, Calvin D", "Acquafredda, Janine"]


# Headers to mimic a browser visit
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
}

for name in candidates:
    query = urllib.parse.quote(f"{name} NYC 2025")
    url = f"https://www.bing.com/images/search?q={query}&form=HDRSC2"

    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find the first image result
    image_element = soup.find('a', class_='iusc')
    if image_element and 'm' in image_element.attrs:
        m_json = eval(image_element['m'])  # Note: Using eval can be unsafe; consider using json.loads after proper formatting
        image_url = m_json.get('murl')
        if image_url:
            try:
                image_data = requests.get(image_url).content
                file_name = f"{name.replace(' ', '_')}.jpg"
                with open(os.path.join(output_dir, file_name), 'wb') as f:
                    f.write(image_data)
                print(f"Downloaded image for {name}")
            except Exception as e:
                print(f"Failed to download image for {name}: {e}")
    else:
        print(f"No image found for {name}")
