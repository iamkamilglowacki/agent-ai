from app.models.recipe import Recipe, Ingredient

SAMPLE_RECIPES = [
    Recipe(
        id="1",
        title="Spaghetti Carbonara",
        description="Klasyczne włoskie danie z makaronu z sosem na bazie jajek, sera pecorino romano i guanciale",
        ingredients=[
            Ingredient(name="makaron spaghetti", amount="400", unit="g"),
            Ingredient(name="guanciale lub boczek", amount="150", unit="g"),
            Ingredient(name="jajka", amount="4", unit="szt"),
            Ingredient(name="ser pecorino romano", amount="100", unit="g"),
            Ingredient(name="czarny pieprz", amount="", unit="do smaku"),
            Ingredient(name="sól", amount="", unit="do smaku")
        ],
        instructions=[
            "Zagotuj osoloną wodę i ugotuj makaron al dente",
            "Pokrój guanciale w kostkę i podsmaż na patelni",
            "W misce wymieszaj jajka z startym serem i pieprzem",
            "Odcedź makaron, zachowując trochę wody z gotowania",
            "Połącz gorący makaron z jajkami i serem, mieszając energicznie",
            "Dodaj podsmażone guanciale i wymieszaj",
            "Podawaj natychmiast, posypane dodatkowym serem i pieprzem"
        ],
        prep_time="10 min",
        cook_time="20 min",
        servings=4,
        difficulty="średni",
        tags=["włoskie", "makaron", "obiad"]
    ),
    Recipe(
        id="2",
        title="Hummus",
        description="Kremowa pasta z ciecierzycy z tahini, idealna jako dip lub dodatek do dań",
        ingredients=[
            Ingredient(name="ciecierzyca z puszki", amount="400", unit="g"),
            Ingredient(name="tahini", amount="60", unit="ml"),
            Ingredient(name="sok z cytryny", amount="60", unit="ml"),
            Ingredient(name="czosnek", amount="2", unit="ząbki"),
            Ingredient(name="oliwa z oliwek", amount="60", unit="ml"),
            Ingredient(name="kminek", amount="1", unit="łyżeczka"),
            Ingredient(name="sól", amount="", unit="do smaku")
        ],
        instructions=[
            "Odsącz i przepłucz ciecierzycę",
            "W blenderze zmiksuj ciecierzycę z tahini",
            "Dodaj sok z cytryny, czosnek i kminek",
            "Miksuj, dolewając powoli oliwę",
            "Dopraw solą do smaku",
            "Podawaj z dodatkową oliwą i papryką"
        ],
        prep_time="10 min",
        cook_time="5 min",
        servings=6,
        difficulty="łatwy",
        tags=["wegetariańskie", "wegańskie", "przekąska", "bliskowschodnie"]
    ),
    Recipe(
        id="3",
        title="Zupa krem z dyni",
        description="Kremowa, rozgrzewająca zupa z dyni z nutą imbiru",
        ingredients=[
            Ingredient(name="dynia", amount="1", unit="kg"),
            Ingredient(name="cebula", amount="1", unit="szt"),
            Ingredient(name="imbir", amount="3", unit="cm"),
            Ingredient(name="czosnek", amount="2", unit="ząbki"),
            Ingredient(name="bulion warzywny", amount="1", unit="l"),
            Ingredient(name="śmietanka 30%", amount="200", unit="ml"),
            Ingredient(name="oliwa", amount="2", unit="łyżki"),
            Ingredient(name="sól i pieprz", amount="", unit="do smaku")
        ],
        instructions=[
            "Dynię obierz i pokrój w kostkę",
            "Podsmaż na oliwie posiekaną cebulę i czosnek",
            "Dodaj startego imbira i dynię",
            "Zalej bulionem i gotuj do miękkości",
            "Zmiksuj na gładki krem",
            "Dodaj śmietankę i dopraw",
            "Podawaj z pestkami dyni"
        ],
        prep_time="15 min",
        cook_time="30 min",
        servings=6,
        difficulty="łatwy",
        tags=["wegetariańskie", "zupa", "jesienne", "rozgrzewające"]
    )
] 