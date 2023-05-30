from flask import Flask, render_template, request, url_for, redirect
from flask_sqlalchemy import SQLAlchemy

# Configuração do Flask e do Banco de Dados
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database_alunos.db'

db = SQLAlchemy(app)


class Aluno(db.Model):
    # Configuração do nome e colunas da tabela
    __tablename__ = 'aluno'
    cpf = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255))
    data_nascimento = db.Column(db.String(255))
    sexo = db.Column(db.String(255))
    idade = db.Column(db.Integer)
    AV1 = db.Column(db.Float)
    AV2 = db.Column(db.Float)
    media = db.Column(db.Float)

    def __init__(self, cpf, nome, data_nascimento, sexo, idade, AV1, AV2, media):
        self.cpf = cpf
        self.nome = nome
        self.data_nascimento = data_nascimento
        self.sexo = sexo
        self.idade = idade
        self.AV1 = AV1
        self.AV2 = AV2
        self.media = media


with app.app_context():
    db.create_all()


@app.route("/index")
def index():
    return render_template("index.html")


# Inicia o servidor no localhost na porta 8080
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
