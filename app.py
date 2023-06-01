from flask import Flask, render_template, request, url_for, redirect, jsonify
from flask_sqlalchemy import SQLAlchemy

# Configuração do Flask e do Banco de Dados
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database_alunos.db'

db = SQLAlchemy(app)


class Aluno(db.Model):
    # Configuração do nome e colunas da tabela
    __tablename__ = 'aluno'
    _id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(255))
    av1 = db.Column(db.Float)
    av2 = db.Column(db.Float)
    media = db.Column(db.Float)

    def __init__(self, nome, av1, av2, media):
        self.nome = nome
        self.av1 = av1
        self.av2 = av2
        self.media = media


with app.app_context():
    db.create_all()


@app.route("/index")
def index():
    return render_template("index.html")


@app.route("/cadastrar")
def cadastrar():
    alunos = Aluno.query.all()
    return render_template("cadastro.html", alunos=alunos)

# Cadastrar alunos
@app.route("/cadastro", methods=['GET', 'POST'])
def cadastro():
    if request.method == "POST":
        nome = request.form.get("nome")
        av1 = request.form.get("av1")
        av2 = request.form.get("av2")
        media = request.form.get("media")

        if nome and av1 and av2 and media:
            al = Aluno(nome, av1, av2, media)
            db.session.add(al)
            db.session.commit()
    return redirect(url_for("cadastrar"))


# Editar alunos
@app.route("/atualizar/<int:id>", methods=['GET', 'POST'])
def atualizar(id):
    alunos = Aluno.query.filter_by(_id=id).first()

    if request.method == "POST":
        nome = request.form.get("nome")
        av1 = request.form.get("av1")
        av2 = request.form.get("av2")
        media = request.form.get("media")

        if nome and av1 and av2 and media:
            alunos.nome = nome
            alunos.av1 = av1
            alunos.av2 = av2
            alunos.media = media

            db.session.commit()
            return redirect(url_for("cadastrar"))
    return render_template("cadastro.html", alunos=alunos)

# Excluir alunos
@app.route("/excluir/<int:id>", methods=['GET', 'POST', 'DELETE'])
def excluir(id):
    alunos = Aluno.query.filter_by(_id=id).first()

    db.session.delete(alunos)
    db.session.commit()

    alunos = Aluno.query.all()
    return render_template("cadastro.html", alunos=alunos)


# Inicia o servidor no localhost na porta 8080
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080, debug=True)
