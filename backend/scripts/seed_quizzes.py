"""Seed many quiz series (QuestionSet) via the REST API as admin.

Usage:
    python backend/scripts/seed_quizzes.py
    python backend/scripts/seed_quizzes.py --base-url http://localhost:8000
    python backend/scripts/seed_quizzes.py --username murat --password admin
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request


DEFAULT_BASE_URL = "http://localhost:8000"
DEFAULT_USERNAME = "murat"
DEFAULT_PASSWORD = "admin"


QUIZZES: list[dict] = [
    {
        "title": "Priorites - Niveau 1",
        "description": "Les regles de priorite a connaitre absolument.",
        "questions": [
            {
                "text": "A une intersection sans signalisation, qui a la priorite ?",
                "explanation": "Priorite a droite par defaut.",
                "choices": [
                    {"text": "Le vehicule venant de droite", "is_correct": True},
                    {"text": "Le vehicule venant de gauche", "is_correct": False},
                    {"text": "Le plus rapide", "is_correct": False},
                    {"text": "Le plus gros vehicule", "is_correct": False},
                ],
            },
            {
                "text": "Un panneau STOP impose-t-il un arret complet ?",
                "explanation": "Le STOP impose un arret total, pieds a l'arret.",
                "choices": [
                    {"text": "Oui, arret obligatoire", "is_correct": True},
                    {"text": "Non, juste ralentir", "is_correct": False},
                    {"text": "Seulement si une voiture arrive", "is_correct": False},
                    {"text": "Uniquement la nuit", "is_correct": False},
                ],
            },
            {
                "text": "Sur un rond-point sans signalisation, qui a la priorite ?",
                "explanation": "Sans panneau, priorite a celui qui entre (rare en France).",
                "choices": [
                    {"text": "Celui qui est deja engage", "is_correct": False},
                    {"text": "Celui qui entre (priorite a droite)", "is_correct": True},
                    {"text": "Personne", "is_correct": False},
                    {"text": "Le plus rapide", "is_correct": False},
                ],
            },
            {
                "text": "Un bus quitte un arret en agglomeration. Que faire ?",
                "explanation": "Le bus a la priorite en agglomeration.",
                "choices": [
                    {"text": "Lui ceder le passage", "is_correct": True},
                    {"text": "Le doubler rapidement", "is_correct": False},
                    {"text": "Klaxonner", "is_correct": False},
                    {"text": "Couper sa route", "is_correct": False},
                ],
            },
            {
                "text": "A une intersection avec un panneau 'Cedez le passage' :",
                "explanation": "Vous devez ceder a tous les vehicules sur la voie prioritaire.",
                "choices": [
                    {"text": "Vous laissez passer les autres", "is_correct": True},
                    {"text": "Vous avez la priorite", "is_correct": False},
                    {"text": "Vous arretez systematiquement", "is_correct": False},
                    {"text": "Vous accelerez", "is_correct": False},
                ],
            },
        ],
    },
    {
        "title": "Signalisation - Panneaux",
        "description": "Reconnaitre et interpreter les panneaux routiers.",
        "questions": [
            {
                "text": "Un panneau triangulaire pointe en haut indique :",
                "explanation": "Forme triangulaire = panneau de danger.",
                "choices": [
                    {"text": "Un danger", "is_correct": True},
                    {"text": "Une obligation", "is_correct": False},
                    {"text": "Une interdiction", "is_correct": False},
                    {"text": "Une indication", "is_correct": False},
                ],
            },
            {
                "text": "Un panneau rond a fond bleu indique :",
                "explanation": "Bleu rond = obligation.",
                "choices": [
                    {"text": "Une interdiction", "is_correct": False},
                    {"text": "Une obligation", "is_correct": True},
                    {"text": "Un danger", "is_correct": False},
                    {"text": "Une fin d'interdiction", "is_correct": False},
                ],
            },
            {
                "text": "Un panneau rond a bordure rouge :",
                "explanation": "Rouge cercle = interdiction.",
                "choices": [
                    {"text": "Indique une interdiction", "is_correct": True},
                    {"text": "Indique une obligation", "is_correct": False},
                    {"text": "Indique un danger", "is_correct": False},
                    {"text": "Indique une priorite", "is_correct": False},
                ],
            },
            {
                "text": "Le panneau 'fin de toutes les interdictions' est :",
                "explanation": "Cercle blanc avec barres diagonales noires.",
                "choices": [
                    {"text": "Rond blanc avec barres noires", "is_correct": True},
                    {"text": "Triangulaire rouge", "is_correct": False},
                    {"text": "Carre bleu", "is_correct": False},
                    {"text": "Octogonal rouge", "is_correct": False},
                ],
            },
            {
                "text": "Une ligne blanche continue au sol :",
                "explanation": "Ligne continue = franchissement interdit.",
                "choices": [
                    {"text": "Ne doit pas etre franchie", "is_correct": True},
                    {"text": "Peut etre franchie pour doubler", "is_correct": False},
                    {"text": "Indique un parking", "is_correct": False},
                    {"text": "Marque un passage pieton", "is_correct": False},
                ],
            },
        ],
    },
    {
        "title": "Vitesses autorisees",
        "description": "Limitations de vitesse en France.",
        "questions": [
            {
                "text": "Vitesse max en agglomeration (voiture, conditions normales) :",
                "explanation": "50 km/h sauf indication contraire.",
                "choices": [
                    {"text": "30 km/h", "is_correct": False},
                    {"text": "50 km/h", "is_correct": True},
                    {"text": "70 km/h", "is_correct": False},
                    {"text": "90 km/h", "is_correct": False},
                ],
            },
            {
                "text": "Vitesse max sur route bidirectionnelle hors agglo :",
                "explanation": "80 km/h depuis 2018.",
                "choices": [
                    {"text": "70 km/h", "is_correct": False},
                    {"text": "80 km/h", "is_correct": True},
                    {"text": "90 km/h", "is_correct": False},
                    {"text": "110 km/h", "is_correct": False},
                ],
            },
            {
                "text": "Vitesse max sur autoroute par temps sec :",
                "explanation": "130 km/h sauf indication contraire.",
                "choices": [
                    {"text": "110 km/h", "is_correct": False},
                    {"text": "120 km/h", "is_correct": False},
                    {"text": "130 km/h", "is_correct": True},
                    {"text": "150 km/h", "is_correct": False},
                ],
            },
            {
                "text": "Vitesse max sur autoroute par pluie :",
                "explanation": "Reduction de 20 km/h sous la pluie.",
                "choices": [
                    {"text": "100 km/h", "is_correct": False},
                    {"text": "110 km/h", "is_correct": True},
                    {"text": "120 km/h", "is_correct": False},
                    {"text": "130 km/h", "is_correct": False},
                ],
            },
            {
                "text": "Jeune conducteur, vitesse max sur autoroute :",
                "explanation": "Permis probatoire = 110 km/h sur autoroute.",
                "choices": [
                    {"text": "100 km/h", "is_correct": False},
                    {"text": "110 km/h", "is_correct": True},
                    {"text": "130 km/h", "is_correct": False},
                    {"text": "90 km/h", "is_correct": False},
                ],
            },
        ],
    },
    {
        "title": "Alcool et drogues",
        "description": "Taux et sanctions liees a l'alcool / aux stupefiants.",
        "questions": [
            {
                "text": "Taux legal d'alcool dans le sang (permis classique) :",
                "explanation": "0.5 g/L de sang en France.",
                "choices": [
                    {"text": "0.2 g/L", "is_correct": False},
                    {"text": "0.5 g/L", "is_correct": True},
                    {"text": "0.8 g/L", "is_correct": False},
                    {"text": "1.0 g/L", "is_correct": False},
                ],
            },
            {
                "text": "Taux legal pour un jeune conducteur :",
                "explanation": "Permis probatoire = 0.2 g/L (tolerance zero ou presque).",
                "choices": [
                    {"text": "0.5 g/L", "is_correct": False},
                    {"text": "0.2 g/L", "is_correct": True},
                    {"text": "0.0 g/L", "is_correct": False},
                    {"text": "0.8 g/L", "is_correct": False},
                ],
            },
            {
                "text": "Une biere standard fait monter le taux d'environ :",
                "explanation": "Environ 0.20 a 0.25 g/L par verre standard.",
                "choices": [
                    {"text": "0.05 g/L", "is_correct": False},
                    {"text": "0.20 g/L", "is_correct": True},
                    {"text": "0.50 g/L", "is_correct": False},
                    {"text": "1.00 g/L", "is_correct": False},
                ],
            },
            {
                "text": "Conduite sous stupefiants :",
                "explanation": "Delit, meme en petite quantite.",
                "choices": [
                    {"text": "Tolere si quantite faible", "is_correct": False},
                    {"text": "Toujours un delit", "is_correct": True},
                    {"text": "Simple contravention", "is_correct": False},
                    {"text": "Autorise hors agglomeration", "is_correct": False},
                ],
            },
            {
                "text": "Refus de soufflage de l'ethylotest :",
                "explanation": "Considere comme delit, sanctions identiques a l'alcoolemie elevee.",
                "choices": [
                    {"text": "Sans consequence", "is_correct": False},
                    {"text": "Considere comme un delit", "is_correct": True},
                    {"text": "Simple amende", "is_correct": False},
                    {"text": "Avertissement", "is_correct": False},
                ],
            },
        ],
    },
    {
        "title": "Distances de securite",
        "description": "Calculer et respecter les distances.",
        "questions": [
            {
                "text": "Distance de securite minimale par temps sec :",
                "explanation": "Regle des 2 secondes entre vehicules.",
                "choices": [
                    {"text": "1 seconde", "is_correct": False},
                    {"text": "2 secondes", "is_correct": True},
                    {"text": "5 secondes", "is_correct": False},
                    {"text": "10 secondes", "is_correct": False},
                ],
            },
            {
                "text": "Distance de freinage a 90 km/h sur sol sec :",
                "explanation": "Environ 56 metres (formule v^2 / 150 sur sol sec).",
                "choices": [
                    {"text": "20 m", "is_correct": False},
                    {"text": "40 m", "is_correct": False},
                    {"text": "55-60 m", "is_correct": True},
                    {"text": "100 m", "is_correct": False},
                ],
            },
            {
                "text": "Sous la pluie, la distance de freinage :",
                "explanation": "Double environ par rapport au sol sec.",
                "choices": [
                    {"text": "Reste identique", "is_correct": False},
                    {"text": "Est divisee par 2", "is_correct": False},
                    {"text": "Double", "is_correct": True},
                    {"text": "Est triplee", "is_correct": False},
                ],
            },
            {
                "text": "Temps de reaction moyen d'un conducteur :",
                "explanation": "Environ 1 seconde en condition normale.",
                "choices": [
                    {"text": "0.1 s", "is_correct": False},
                    {"text": "1 s", "is_correct": True},
                    {"text": "3 s", "is_correct": False},
                    {"text": "5 s", "is_correct": False},
                ],
            },
            {
                "text": "Sur autoroute, intervalle minimum entre vehicules :",
                "explanation": "Au moins 2 traits blancs (~ 90 m a 130 km/h).",
                "choices": [
                    {"text": "1 trait blanc", "is_correct": False},
                    {"text": "2 traits blancs", "is_correct": True},
                    {"text": "10 metres", "is_correct": False},
                    {"text": "Aucune regle", "is_correct": False},
                ],
            },
        ],
    },
    {
        "title": "Stationnement",
        "description": "Regles de stationnement et arret.",
        "questions": [
            {
                "text": "Stationner devant une bouche d'incendie :",
                "explanation": "Interdit, considere comme tres genant.",
                "choices": [
                    {"text": "Autorise 5 minutes", "is_correct": False},
                    {"text": "Toujours interdit", "is_correct": True},
                    {"text": "Autorise la nuit", "is_correct": False},
                    {"text": "Autorise le dimanche", "is_correct": False},
                ],
            },
            {
                "text": "Une ligne jaune continue au bord :",
                "explanation": "Stationnement et arret interdits.",
                "choices": [
                    {"text": "Stationnement et arret interdits", "is_correct": True},
                    {"text": "Stationnement autorise", "is_correct": False},
                    {"text": "Arret autorise mais pas stationnement", "is_correct": False},
                    {"text": "Reservee aux taxis", "is_correct": False},
                ],
            },
            {
                "text": "Stationner sur un trottoir :",
                "explanation": "Tres genant, amende elevee.",
                "choices": [
                    {"text": "Autorise si on laisse 1m de passage", "is_correct": False},
                    {"text": "Tres genant et interdit", "is_correct": True},
                    {"text": "Autorise hors agglomeration", "is_correct": False},
                    {"text": "Autorise la nuit", "is_correct": False},
                ],
            },
            {
                "text": "Une ligne jaune discontinue :",
                "explanation": "Arret autorise mais stationnement interdit.",
                "choices": [
                    {"text": "Tout interdit", "is_correct": False},
                    {"text": "Arret autorise, stationnement interdit", "is_correct": True},
                    {"text": "Tout autorise", "is_correct": False},
                    {"text": "Reservee aux livraisons", "is_correct": False},
                ],
            },
            {
                "text": "Sur une place handicape sans GIC/GIG :",
                "explanation": "Amende forfaitaire elevee + mise en fourriere possible.",
                "choices": [
                    {"text": "Autorise 15 min", "is_correct": False},
                    {"text": "Toujours interdit", "is_correct": True},
                    {"text": "Autorise la nuit", "is_correct": False},
                    {"text": "Autorise le week-end", "is_correct": False},
                ],
            },
        ],
    },
    {
        "title": "Premiers secours",
        "description": "Que faire en cas d'accident.",
        "questions": [
            {
                "text": "Etapes en cas d'accident :",
                "explanation": "Proteger, Alerter, Secourir (PAS).",
                "choices": [
                    {"text": "Proteger, Alerter, Secourir", "is_correct": True},
                    {"text": "Secourir, Alerter, Proteger", "is_correct": False},
                    {"text": "Filmer, Partager, Partir", "is_correct": False},
                    {"text": "Alerter, Partir, Oublier", "is_correct": False},
                ],
            },
            {
                "text": "Numero d'urgence europeen :",
                "explanation": "112 fonctionne dans toute l'UE.",
                "choices": [
                    {"text": "15", "is_correct": False},
                    {"text": "17", "is_correct": False},
                    {"text": "18", "is_correct": False},
                    {"text": "112", "is_correct": True},
                ],
            },
            {
                "text": "Numero des pompiers en France :",
                "explanation": "18 = pompiers.",
                "choices": [
                    {"text": "15", "is_correct": False},
                    {"text": "17", "is_correct": False},
                    {"text": "18", "is_correct": True},
                    {"text": "115", "is_correct": False},
                ],
            },
            {
                "text": "Faut-il deplacer un blesse hors du vehicule ?",
                "explanation": "Sauf danger immediat (incendie), on ne deplace pas.",
                "choices": [
                    {"text": "Oui, toujours", "is_correct": False},
                    {"text": "Non, sauf danger immediat", "is_correct": True},
                    {"text": "Oui pour les remettre debout", "is_correct": False},
                    {"text": "Oui pour les rassurer", "is_correct": False},
                ],
            },
            {
                "text": "Triangle de presignalisation place a quelle distance ?",
                "explanation": "Au moins 30 m, et plus loin sur autoroute.",
                "choices": [
                    {"text": "5 m", "is_correct": False},
                    {"text": "10 m", "is_correct": False},
                    {"text": "30 m minimum", "is_correct": True},
                    {"text": "100 m exactement", "is_correct": False},
                ],
            },
        ],
    },
    {
        "title": "Mecanique de base",
        "description": "Connaissances mecaniques minimales.",
        "questions": [
            {
                "text": "Pression des pneus a verifier :",
                "explanation": "Au moins une fois par mois et avant long trajet, a froid.",
                "choices": [
                    {"text": "Tous les 5 ans", "is_correct": False},
                    {"text": "Au moins 1 fois par mois", "is_correct": True},
                    {"text": "Jamais", "is_correct": False},
                    {"text": "Uniquement chez le garagiste", "is_correct": False},
                ],
            },
            {
                "text": "Profondeur minimale legale des sculptures de pneu :",
                "explanation": "1.6 mm minimum.",
                "choices": [
                    {"text": "0.5 mm", "is_correct": False},
                    {"text": "1.6 mm", "is_correct": True},
                    {"text": "5 mm", "is_correct": False},
                    {"text": "10 mm", "is_correct": False},
                ],
            },
            {
                "text": "Voyant rouge moteur allume, que faire ?",
                "explanation": "Anomalie grave, s'arreter en securite.",
                "choices": [
                    {"text": "Continuer", "is_correct": False},
                    {"text": "Accelerer pour rentrer", "is_correct": False},
                    {"text": "S'arreter en securite", "is_correct": True},
                    {"text": "Ignorer", "is_correct": False},
                ],
            },
            {
                "text": "Liquide de refroidissement bas :",
                "explanation": "A faire d'appoint a froid uniquement, risque de surchauffe.",
                "choices": [
                    {"text": "Faire l'appoint, moteur froid", "is_correct": True},
                    {"text": "Faire l'appoint, moteur chaud", "is_correct": False},
                    {"text": "Ignorer", "is_correct": False},
                    {"text": "Rouler tres vite", "is_correct": False},
                ],
            },
            {
                "text": "Controle technique passe tous les :",
                "explanation": "2 ans, apres les 4 ans du vehicule neuf.",
                "choices": [
                    {"text": "1 an", "is_correct": False},
                    {"text": "2 ans", "is_correct": True},
                    {"text": "5 ans", "is_correct": False},
                    {"text": "10 ans", "is_correct": False},
                ],
            },
        ],
    },
    {
        "title": "Conduite de nuit",
        "description": "Particularites de la conduite nocturne.",
        "questions": [
            {
                "text": "En croisement la nuit, quels feux utiliser ?",
                "explanation": "Feux de croisement pour ne pas eblouir.",
                "choices": [
                    {"text": "Feux de route", "is_correct": False},
                    {"text": "Feux de croisement", "is_correct": True},
                    {"text": "Aucun feu", "is_correct": False},
                    {"text": "Feux de detresse", "is_correct": False},
                ],
            },
            {
                "text": "Eblouissement par les feux d'un vehicule en face :",
                "explanation": "Regarder le bord droit de la chaussee.",
                "choices": [
                    {"text": "Fixer leurs phares", "is_correct": False},
                    {"text": "Fermer les yeux", "is_correct": False},
                    {"text": "Regarder le bord droit", "is_correct": True},
                    {"text": "Accelerer", "is_correct": False},
                ],
            },
            {
                "text": "Vehicule arrete la nuit hors agglomeration :",
                "explanation": "Allumer les feux de position au minimum.",
                "choices": [
                    {"text": "Aucun feu", "is_correct": False},
                    {"text": "Feux de position au minimum", "is_correct": True},
                    {"text": "Feux de route", "is_correct": False},
                    {"text": "Pleins phares", "is_correct": False},
                ],
            },
            {
                "text": "La nuit, la fatigue se manifeste par :",
                "explanation": "Baillements, picotements, perte d'attention.",
                "choices": [
                    {"text": "Plus d'energie", "is_correct": False},
                    {"text": "Baillements et picotements", "is_correct": True},
                    {"text": "Meilleure vision", "is_correct": False},
                    {"text": "Reflexes accrus", "is_correct": False},
                ],
            },
            {
                "text": "Fatigue : pause recommandee toutes les :",
                "explanation": "2 heures de conduite continue.",
                "choices": [
                    {"text": "30 min", "is_correct": False},
                    {"text": "1 h", "is_correct": False},
                    {"text": "2 h", "is_correct": True},
                    {"text": "5 h", "is_correct": False},
                ],
            },
        ],
    },
    {
        "title": "Eco-conduite",
        "description": "Conduire de maniere economique et ecologique.",
        "questions": [
            {
                "text": "Pour reduire la consommation, on doit :",
                "explanation": "Anticiper et eviter les freinages brusques.",
                "choices": [
                    {"text": "Accelerer puis freiner souvent", "is_correct": False},
                    {"text": "Anticiper et conduire souplement", "is_correct": True},
                    {"text": "Rouler en sous-regime constant", "is_correct": False},
                    {"text": "Garder la clim au maximum", "is_correct": False},
                ],
            },
            {
                "text": "Vitesse la plus economique sur autoroute :",
                "explanation": "Autour de 110 km/h consomme nettement moins que 130.",
                "choices": [
                    {"text": "90 km/h", "is_correct": False},
                    {"text": "110 km/h", "is_correct": True},
                    {"text": "130 km/h", "is_correct": False},
                    {"text": "150 km/h", "is_correct": False},
                ],
            },
            {
                "text": "Sur-gonflage des pneus :",
                "explanation": "Reduit l'adherence, dangereux meme si reduit la conso.",
                "choices": [
                    {"text": "Reduit l'adherence", "is_correct": True},
                    {"text": "Augmente l'adherence", "is_correct": False},
                    {"text": "Sans effet", "is_correct": False},
                    {"text": "Augmente la duree de vie", "is_correct": False},
                ],
            },
            {
                "text": "Coffre de toit et consommation :",
                "explanation": "Augmente la consommation (resistance a l'air).",
                "choices": [
                    {"text": "Aucun effet", "is_correct": False},
                    {"text": "Augmente la consommation", "is_correct": True},
                    {"text": "Diminue la consommation", "is_correct": False},
                    {"text": "Ameliore l'aerodynamisme", "is_correct": False},
                ],
            },
            {
                "text": "Climatisation a forte vitesse :",
                "explanation": "Moins gourmande qu'une fenetre ouverte a > 80 km/h.",
                "choices": [
                    {"text": "Plus gourmande qu'une fenetre ouverte", "is_correct": False},
                    {"text": "Moins gourmande qu'une fenetre ouverte", "is_correct": True},
                    {"text": "Aucun effet", "is_correct": False},
                    {"text": "A eviter par tous les temps", "is_correct": False},
                ],
            },
        ],
    },
]


def http_post(url: str, payload: dict, token: str | None = None) -> dict:
    body = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request) as response:
            raw = response.read().decode("utf-8") or "{}"
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="ignore")
        raise SystemExit(
            f"HTTP {exc.code} on {url}\nPayload: {json.dumps(payload)[:500]}\nResponse: {details}"
        ) from exc


def login(base_url: str, username: str, password: str) -> str:
    data = http_post(
        f"{base_url}/api/auth/token/",
        {"username": username, "password": password},
    )
    access = data.get("access")
    if not access:
        raise SystemExit(f"No access token in response: {data}")
    return access


def create_question_set(base_url: str, token: str, title: str, description: str) -> int:
    data = http_post(
        f"{base_url}/api/question-sets/",
        {"title": title, "description": description, "is_published": True},
        token=token,
    )
    qs_id = data.get("id")
    if not qs_id:
        raise SystemExit(f"No id returned for QuestionSet: {data}")
    return qs_id


def create_question(
    base_url: str,
    token: str,
    question_set_id: int,
    text: str,
    explanation: str,
    order: int,
    choices: list[dict],
) -> int:
    data = http_post(
        f"{base_url}/api/questions/",
        {
            "question_set": question_set_id,
            "text": text,
            "explanation": explanation,
            "order": order,
            "choices": choices,
        },
        token=token,
    )
    return data.get("id")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--username", default=DEFAULT_USERNAME)
    parser.add_argument("--password", default=DEFAULT_PASSWORD)
    args = parser.parse_args()

    print(f"> Login on {args.base_url} as {args.username}")
    token = login(args.base_url, args.username, args.password)
    print("  OK, JWT obtained")

    total_questions = 0
    for index, quiz in enumerate(QUIZZES, start=1):
        qs_id = create_question_set(
            args.base_url, token, quiz["title"], quiz["description"]
        )
        print(f"[{index}/{len(QUIZZES)}] QuestionSet #{qs_id}: {quiz['title']}")
        for order, q in enumerate(quiz["questions"], start=1):
            create_question(
                args.base_url,
                token,
                qs_id,
                q["text"],
                q.get("explanation", ""),
                order,
                q["choices"],
            )
            total_questions += 1

    print(
        f"\nDone. {len(QUIZZES)} question sets created, "
        f"{total_questions} questions total."
    )


if __name__ == "__main__":
    main()
